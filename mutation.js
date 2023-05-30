const { ApolloServer, gql } = require("apollo-server");
const { USERS, POSTS } = require("./utils/data");

//! Make a mock data
let posts = POSTS;

//* Helper function
const findUserById = (id) => USERS.find((user) => user.id === id);
const findUserByName = (name) => USERS.find((user) => user.name === name);
const filterPostsByAuthorId = (authorId) =>
  POSTS.filter((post) => post.authorId === authorId);
const findPostById = (id) => POSTS.find((post) => post.id === id);

const meId = 1;

//* 增加Mutation
//! Mutation跟Query一樣，功能上沒有差別，但是將功能用不同的語意來命名，讓使用者知道這個操作會對資料做出改變

//* 一個是傳入 Argument 作為 Input ，一個是用於資料索取展示。
const typeDefs = gql`
  type User {
    id: ID!
    name: String
    age: Int
    posts: [Post]
  }

  type Post {
    id: ID!
    author: User
    title: String
    content: String
    likeGivers: [User]
  }

  type Query {
    user(name: String!): User
  }

  type Mutation {
    addPost(input: AddPostInput!): Post
    likePost(postId: ID!): Post
  }

  input AddPostInput {
    title: String!
    content: String
  }
`;

const resolvers = {
  Query: {
    user: (root, args) => {
      const { name } = args;
      return findUserByName(name);
    },
  },
  User: {
    posts: (parent) => {
      const { id } = parent; //取得 User 的 id
      return filterPostsByAuthorId(id); //return posts of POSTS
    },
  },
  Post: {
    likeGivers: (parent) => {
      const { likeGiverIds } = parent; //get likeGiverIds from post
      return likeGiverIds.map((id) => findUserById(id));
    },

    author: (parent) => {
      return findUserById(parent.authorId);
    },
  },

  Mutation: {
    addPost: (root, args, context) => {
      const { title, content } = args.input;

      const newPost = {
        id: posts.length + 1,
        authorId: meId,
        title,
        content,
        likeGiverIds: [],
      };

      posts.push(newPost);
      return newPost;
    },
    likePost: (root, args, context) => {
      const { postId } = args;
      const post = findPostById(postId);
      if (!post) throw new Error(`Post ${psotId} Not Exists`);
      if (post.likeGiverIds.includes(meId)) {
        // 如果已經按過讚就收回
        const index = post.likeGiverIds.findIndex((v) => v === userId);
        post.likeGiverIds.splice(index, 1);
      } else {
        // 否則就加入 likeGiverIds 名單
        post.likeGiverIds.push(meId);
      }
      return post;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen().then((res) => {
  console.log(`Start server with ${res.url}`);
});
