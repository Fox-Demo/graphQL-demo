const { ApolloServer, gql } = require("apollo-server");
const { USERS } = require("./utils/data");

// note:  Operation Name, Aliases, Fragment 三個純為 query 技巧 ; 而 Arguments 與 Variables 兩個 query 技巧則需要 Schema 設計的參與。

//* 這邊height定義了一個Argument => unit 且預設是Kilogram
//* 這邊weight定義了一個Argument => unit 且預設是Centimeter

const typeDefs = gql`
  enum HeightUnit {
    METER
    CENTIMETER
    FOOT
  }

  enum WeightUnit {
    KILOGRAM
    POUND
    GRAM
  }

  type User {
    id: ID!
    name: String
    age: Int
    weight(unit: WeightUnit = KILOGRAM): Float
    height(unit: HeightUnit = CENTIMETER): Float
  }

  type Query {
    me: User
    user(name: String!): User
    users: [User]
  }
`;

const resolvers = {
  Query: {
    me: () => USERS[0],
    user: (root, args, context) => {
      const { name } = args;
      return USERS.find((user) => user.name === name);
    },
    users: () => USERS,
  },

  User: {
    height: (parent, args, context) => {
      const { unit } = args;
      if (!unit || unit === "CENTIMETER") return parent.height;
      else if (unit === "METER") return parent.height / 100;
      else if (unit === "FOOT") return parent.height / 30.48;
      throw new Error(`Height unit "${unit}" not supported.`);
    },
    weight: (parent, args, context) => {
      const { unit } = args;
      if (!unit || unit === "KILOGRAM") return parent.weight;
      else if (unit === "POUND") return parent.weight * 2.2;
      else if (unit === "GRAM") return parent.weight * 1000;
      throw new Error(`Weight unit "${unit}" not supported.`);
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
