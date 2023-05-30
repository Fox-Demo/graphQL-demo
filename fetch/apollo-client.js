const { ApolloClient, InMemoryCache, gql } = require("@apollo/client");
const API_URL = "https://api-mumbai.lens.dev/";

const apolloClient = new ApolloClient({
  uri: API_URL,
  cache: new InMemoryCache(),
});

const query = `
  query {
    ping
  }
`;

const queryExample = async () => {
  const response = await apolloClient.query({
    query: gql(query),
  });
  console.log("Lens example data: ", response);
};

queryExample();
