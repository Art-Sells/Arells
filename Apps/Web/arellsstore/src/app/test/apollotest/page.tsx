import React from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

const client = new ApolloClient({
  uri: 'https://example.com/graphql',
  cache: new InMemoryCache(),
});

function ApolloTest() {
  return (
    <ApolloProvider client={client}>
      <p> Test </p>
    </ApolloProvider>
  );
}

export default ApolloTest;
