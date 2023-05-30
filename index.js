const { ApolloServer, gql } = require("apollo-server");
const { USERS } = require("./utils/data");

// Note: ROOT 是一種擁有三個 fields 的 Object type(Mutation, Subscription, Query)
//* Schema 定義輪廓跟規範
//* 這邊有兩個Object type: User && Query
//! Query type 是Schema的進入點

const typeDefs = gql`
  type User {
    "//! 有驚嘆號(!)代表這個欄位一定會有值"
    id: ID!
    name: String
    age: Int
  }

  type Query {
    "A simple type for getting started!"
    hello: String
    me: User
  }
`;

//* Resolver 的工作就是基於Schema的設計來完成資料的取得跟計算
//! 只能是回傳function 或是 object
const resolvers = {
  Query: {
    hello: () => "hello world",
    me: () => USERS[0],
  },
};

const Server = new ApolloServer({
  typeDefs,
  resolvers,
});

Server.listen().then((res) => {
  console.log(`Start server with ${res.url}`);
});
