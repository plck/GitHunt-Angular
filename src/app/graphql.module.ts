import { NgModule } from '@angular/core';
import { ApolloModule, Apollo } from 'apollo-angular';
import { HttpLinkModule, HttpLink } from 'apollo-angular-link-http';
import { onError } from 'apollo-link-error';
import { ApolloLink, from } from 'apollo-link';
import { WebSocketLink } from 'apollo-link-ws';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { getMainDefinition } from 'apollo-utilities';
import { RetryLink } from 'apollo-link-retry';
import { persistCache } from 'apollo-cache-persist';

import { environment } from '../environments/environment';

const subscriptionLink = new WebSocketLink({
  uri: environment.graphql.ws,
  options: { reconnect: true }
});

const retryLink = new RetryLink({
  delay: {
    initial: 1000,
    max: Infinity,
    jitter: false
  },
  attempts: (count, operation, error) => {
    console.log(count);
    const serverUnavailable = count >= 3;
    return serverUnavailable;
  }
});

const graphQLErrorHandler = onError(({ operation, graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    console.error(`[ERROR]: Error trying to execute ${operation.operationName}.`);
    console.error('Error log:', graphQLErrors);
  }
  if (networkError) {
    console.error('Network Error:', networkError);
  }
});

@NgModule({
  exports: [
    ApolloModule
  ]
})
export class GraphQLModule {
  constructor(
    apollo: Apollo
  ) {
    apollo.create({
      link: from([
        retryLink as any,
        graphQLErrorHandler as any,
        subscriptionLink as any
      ]),
      cache: new InMemoryCache()
    });
  }
}
