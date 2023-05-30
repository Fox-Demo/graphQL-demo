const { ApolloServer, gql } = require("apollo-server");
const { meId, users, posts } = require("./data");

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

const updatePost = (postId, data) =>
  Object.assign(findPostByPostId(postId), data);

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

  input UpdateMyInfoInput {
    name: String
    age: Int
  }

  input AddPostInput {
    title: String!
    body: String
  }

  type Mutation {
    updateMyInfo(input: UpdateMyInfoInput!): User
    addFriend(userId: ID!): User
    addPost(input: AddPostInput!): Post
    likePost(postId: ID!): Post
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

const resolvers = {
  Query: {
    hello: () => "world",
    me: () => findUserByUserId(meId),
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
    updateMyInfo: (root, { input: { name, age } }, context) => {
      return updateUserInfo(meId, { name, age });
    },
    addPost: (root, { input: { title, body } }, context) => {
      return addPost({ authorId: meId, title, body });
    },
    likePost: (root, { input: postId }, context) => {},
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
