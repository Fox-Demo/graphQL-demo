const { ApolloServer, gql, ForbiddenError } = require("apollo-server");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { userModel, postModel } = require("./models");

require("dotenv").config();

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS);
const SECRET = process.env.SECRET;

//* Helper Function

const isAuth = (resolverFunc) => (parent, args, context) => {
  if (!context.me) throw new ForbiddenError("Not Login");
  return resolverFunc(parent, args, context);
};

const isAuthor = (resolverFunc) => (parent, args, context) => {
  const { postModel, me } = context;
  const post = postModel.findPostByPostId(args.postId);
  if (me.id !== post.authorId) throw new ForbiddenError("Not Author");
  return resolverFunc(parent, args, context);
};

const hash = (text, saltRounds) => bcrypt.hash(text, saltRounds);

const createToken = ({ id, email, password }, secret) =>
  jwt.sign({ id, email, password }, secret, { expiresIn: "1d" });

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
    me: isAuth((root, args, { userModel, me }) => {
      return userModel.findUserByUserId(me.id);
    }),
    users: (root, args, { userModel }) => userModel.getAllUsers(),
    user: (root, { name }, { userModel }) => userModel.findUserByName(name),
    posts: (root, args, { postModel }) => postModel.getAllPosts(),
    post: (root, { id }, { postModel }) => postModel.findPostByPostId(id),
  },
  User: {
    posts: (parent, args, { postModel }) =>
      postModel.filterPostsByUserId(parent.id),
    friends: (parent, args, context) =>
      filterUsersByUserIds(parent.friendIds || []),
  },
  Post: {
    author: (parent, args, context) => findUserByUserId(parent.authorId),
    likeGivers: (parent, args, context) =>
      filterUsersByUserIds(parent.likeGiverIds),
  },
  Mutation: {
    signUp: async (root, { name, email, password }, { saltRounds }) => {
      //! 檢查是否有重複的 email
      const isUserEmailDuplicate = users.some((user) => user.email === email);
      if (isUserEmailDuplicate) {
        throw new Error(`User email ${email} is already existed.`);
      }

      //! 將密碼做 hash 處理
      const hashedPassword = await hash(password, saltRounds);

      return addUser({ name, email, password: hashedPassword });
    },

    login: async (root, { email, password }, { secret }) => {
      //! 1. 檢查是否有此 email
      const user = users.find((user) => user.email === email);
      if (!user) throw new Error(`User email ${email} is not existed.`);

      //! 2. 檢查密碼是否正確
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) throw new Error("Password is not correct.");

      //! 3. 簽發 token
      return { token: createToken(user, secret) };
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
  //* 在送出query的時候可以在header裡面加入參數
  context: async ({ req }) => {
    const context = {
      secret: SECRET,
      saltRounds: SALT_ROUNDS,
      userModel,
      postModel,
    };

    //! 取出header中的 "x-token" 的值
    const token = req.headers["x-token"];
    if (token) {
      try {
        //! 檢查token 取出解析的資料
        const me = await jwt.verify(token, SECRET);
        //! 放進context
        return { ...context, me };
      } catch (e) {
        throw new Error("Your session expired. Sign in again.");
      }
    }

    return context;
  },
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

// Note 除了以上的方法，Apollo 其實就比較推薦資料取得的 function 都包在 Model 裡面，像 findUserByUserId, updateUserInfo 等等就包進 UserModel 中，而 Authorization 部分就做在 UserModel 裡，如此一來可以隱藏更多實作細節甚至減少程式碼。

// Note 或是有些人會用 GraphQL Directives 來做 Authorization ，透過在 Schema 放上 @authenticated 之類的標籤來達到更易讀的目的。
