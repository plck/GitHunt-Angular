import { NgModule } from '@angular/core';
import { ApolloModule, Apollo } from 'apollo-angular';
import { HttpLinkModule, HttpLink } from 'apollo-angular-link-http';
import { ApolloLink } from 'apollo-link';
import { WebSocketLink } from 'apollo-link-ws';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { getMainDefinition } from 'apollo-utilities';

import { environment } from '../environments/environment';

const subscriptionLink = new WebSocketLink({
  uri: environment.graphql.ws,
  options: { reconnect: true }
});

// TODO: batching
const requestLink = (queryOrMutationLink: ApolloLink) => ApolloLink.split(
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query);
    return kind === 'OperationDefinition' && operation === 'subscription';
  },
  subscriptionLink,
  queryOrMutationLink,
);


@NgModule({
  exports: [
    ApolloModule,
    HttpLinkModule
  ]
})
export class GraphQLModule {
  constructor(
    apollo: Apollo,
    httpLink: HttpLink
  ) {
    const link = requestLink(
      httpLink.create({
        uri: environment.graphql.http,
        withCredentials: true
      })
    );

    apollo.create({
      link,
      cache: new InMemoryCache
    });
  }
}
