const { ApolloServer, gql, ForbiddenError } = require("apollo-server");
const { users, posts } = require("./data");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// 定義 bcrypt 加密所需 saltRounds 次數
const SALT_ROUNDS = 2;
// 定義 jwt 所需 secret (可隨便打)
const SECRET = "just_a_random_secret";

//* Helper function

const isAuth = (resolverFunc) => (parent, args, context) => {
  if (!context.me) throw new ForbiddenError("Not Login");
  return resolverFunc(parent, args, context);
};

const isAuthor = (resolverFunc) => (parent, args, context) => {
  const post = findPostByPostId(args.postId);
  if (context.me.id !== post.authorId) throw new ForbiddenError("Not Author");
  return resolverFunc(parent, args, context);
};

const filterPostsByUserId = (userId) =>
  posts.filter((post) => userId === post.authorId);

const filterUsersByUserIds = (userIds) =>
  users.filter((user) => userIds.includes(user.id));

const findUserByUserId = (userId) =>
  users.find((user) => user.id === Number(userId)); //* ID Scalar Type 預設String，所以要轉Number

const findUserByName = (name) => users.find((user) => user.name === name);

const findPostByPostId = (postId) =>
  posts.find((post) => post.id === Number(postId));

const updateUserInfo = (userId, data) =>
  Object.assign(findUserByUserId(userId), data);

const addPost = ({ authorId, title, body }) =>
  (posts[posts.length] = {
    id: posts[posts.length - 1].id + 1,
    authorId,
    title,
    body,
    likeGiverIds: [],
    createdAt: new Date().toISOString(),
  });

const deletePost = (postId) => {
  return posts.splice(
    posts.findIndex((post) => post.id === Number(postId)),
    1
  )[0];
};

const updatePost = (postId, data) =>
  Object.assign(findPostByPostId(postId), data);

const hash = (text) => bcrypt.hash(text, SALT_ROUNDS);

const addUser = ({ name, email, password }) =>
  (users[users.length] = {
    id: users[users.length - 1].id + 1,
    name,
    email,
    password,
  });

const createToken = ({ id, email, password }) =>
  jwt.sign({ id, email, password }, SECRET, { expiresIn: "1d" });

//* Type Define

const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    name: String
    age: Int
    friends: [User]
    posts: [Post]
  }

  type Post {
    id: ID!
    author: User
    title: String
    body: String
    likeGivers: [User]
    createdAt: String
  }

  type Token {
    token: String!
  }

  input UpdateMyInfoInput {
    name: String
    age: Int
  }

  input AddPostInput {
    title: String!
    body: String
  }

  type Mutation {
    signUp(name: String, email: String!, password: String!): User
    login(email: String!, password: String!): Token
    updateMyInfo(input: UpdateMyInfoInput!): User
    addFriend(userId: ID!): User
    addPost(input: AddPostInput!): Post
    likePost(postId: ID!): Post
    deletePost(postId: ID!): Post
  }

  type Query {
    hello: String
    me: User
    users: [User]
    user(name: String!): User
    posts: [Post]
    post(id: ID!): Post
  }
`;

//*  Resolver
const resolvers = {
  Query: {
    hello: () => "world",
    me: isAuth((root, args, { me }) => {
      return findUserByUserId(me.id);
    }),
    users: () => users,
    user: (root, { name }, context) => findUserByName(name),
    posts: () => posts,
    post: (root, { id }, context) => findPostByPostId(id),
  },
  User: {
    posts: (parent, args, context) => filterPostsByUserId(parent.id),
    friends: (parent, args, context) =>
      filterUsersByUserIds(parent.friendIds || []),
  },
  Post: {
    author: (parent, args, context) => findUserByUserId(parent.authorId),
    likeGivers: (parent, args, context) =>
      filterUsersByUserIds(parent.likeGiverIds),
  },
  Mutation: {
    signUp: async (root, { name, email, password }, context) => {
      //! 檢查是否有重複的 email
      const isUserEmailDuplicate = users.some((user) => user.email === email);
      if (isUserEmailDuplicate) {
        throw new Error(`User email ${email} is already existed.`);
      }

      //! 將密碼做 hash 處理
      const hashedPassword = await hash(password, SALT_ROUNDS);

      return addUser({ name, email, password: hashedPassword });
    },

    login: async (root, { email, password }, context) => {
      //! 1. 檢查是否有此 email
      const user = users.find((user) => user.email === email);
      if (!user) throw new Error(`User email ${email} is not existed.`);

      //! 2. 檢查密碼是否正確
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) throw new Error("Password is not correct.");

      //! 3. 簽發 token
      return { token: createToken(user) };
    },

    updateMyInfo: isAuth((root, { input: { name, age } }, { me }) => {
      return updateUserInfo(me.id, { name, age });
    }),

    addPost: isAuth((root, { input: { title, body } }, { me }) => {
      return addPost({ authorId: me.id, title, body });
    }),

    addFriend: isAuth((root, { userId }, { me }) => {
      if (!me.friendIds.includes(userId)) {
        return updateUserInfo(userId, {
          friendIds: me.friendIds.concat(userId),
        });
      } else {
        return updateUserInfo(userId, {
          friendIds: me.friendIds.filter((id) => id === userId),
        });
      }
    }),
    likePost: isAuth((root, { postId }, { me }) => {
      const post = findPostByPostId(postId);

      if (!post) {
        throw new Error(`Post ${postId} is not found`);
      }

      if (!post.likeGiverIds.includes(me.id)) {
        return updatePost(postId, {
          likeGiverIds: post.likeGiverIds.concat(me.id),
        });
      }

      return updatePost(postId, {
        likeGiverIds: post.likeGiverIds.filter((id) => id === me.id),
      });
    }),

    deletePost: isAuth(
      isAuthor((root, { postId }, { me }) => {
        const post = findPostByPostId(postId);

        if (!post) {
          throw new Error(`Post ${postId} is not found`);
        }

        return deletePost(postId);
      })
    ),
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    //* 在送出query的時候可以在header裡面加入參數

    //! 取出header中的 "x-token" 的值
    const token = req.headers["x-token"];
    if (token) {
      try {
        //! 檢查token 取出解析的資料
        const me = await jwt.verify(token, SECRET);
        //! 放進context
        return { me };
      } catch (e) {
        throw new Error("Your session expired. Sign in again.");
      }
    }
    //! 沒有token就傳空的出去
    return {};
  },
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

// Note 除了以上的方法，Apollo 其實就比較推薦資料取得的 function 都包在 Model 裡面，像 findUserByUserId, updateUserInfo 等等就包進 UserModel 中，而 Authorization 部分就做在 UserModel 裡，如此一來可以隱藏更多實作細節甚至減少程式碼。

// Note 或是有些人會用 GraphQL Directives 來做 Authorization ，透過在 Schema 放上 @authenticated 之類的標籤來達到更易讀的目的。
