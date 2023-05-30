const { ApolloServer, gql } = require("apollo-server");
const { USERS } = require("./utils/data");

// note: 每一個 Field 都可以擁有自己的 Field Resolver ，不管是 Object Type 或是 Scalar Type 都可以

const typeDefs = gql`
  type User {
    id: ID!
    name: String
    age: Int
    friends: [User]
  }

  type Query {
    me: User
  }
`;

const resolvers = {
  Query: {
    me: () => USERS[0],
  },

  //* Field Resolver => 可以針對User的field做特別的處理
  //! 在此例子中Query的me會使用到
  //! 在此例子中me的friends會使用到
  User: {
    //* 如果這邊query到的name是Fong，就會回傳FOXXXXXX
    name: (parent) => {
      let result = parent.name;
      if (parent.name === "Fong") {
        result = "FOXXXXXX";
      }

      return result;
    },
    friends: (parent, args, context) => {
      const { friendIds } = parent;

      return USERS.filter((user) => friendIds.includes(user.id));
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
