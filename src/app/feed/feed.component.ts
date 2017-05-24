import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Apollo, ApolloQueryObservable} from 'apollo-angular';
import {Subscription} from 'rxjs/Subscription';
import {Subject} from 'rxjs/Subject';

import 'rxjs/add/operator/toPromise';

import {OnVoteEvent} from './feed-entry.component';
import {feedQuery, voteMutation} from './feed.model';

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html'
})
export class FeedComponent implements OnInit, OnDestroy {

  public feed: any;
  public currentUser: any;
  public loading = true;

  private type: Subject<string> = new Subject<string>();
  private offset = 0;
  private itemsPerPage = 10;
  private feedSub: Subscription;
  private feedObs: ApolloQueryObservable<any>;

  constructor(
    private route: ActivatedRoute,
    private apollo: Apollo
  ) {}

  public ngOnInit(): void {
    // Fetch
    this.feedObs = this.apollo.watchQuery({
      query: feedQuery,
      variables: {
        type: this.type,
        offset: this.offset,
        limit: this.itemsPerPage
      },
      fetchPolicy: 'network-only',
    });

    // Subscribe
    this.feedSub = this.feedObs.subscribe(({data, loading}) => {
      this.feed = data.feed;
      this.currentUser = data.currentUser;
      this.loading = loading;
    });

    // Listen to the route
    this.route.params.subscribe((params) => {
      this.loading = true;
      this.type.next((params['type'] || 'top').toUpperCase());
    });
  }

  public onVote(event: OnVoteEvent): void {
    this.apollo.mutate({
      mutation: voteMutation,
      variables: {
        repoFullName: event.repoFullName,
        type: event.type,
      },
    }).toPromise();
  }

  public fetchMore(): void {
    this.feedObs.fetchMore({
      variables: {
        offset: this.offset + this.itemsPerPage
      },
      updateQuery: (prev, {fetchMoreResult}) => pushEntries(prev, fetchMoreResult)
    })
      .then(() => {
        this.offset += this.itemsPerPage;
      });
  }

  public ngOnDestroy(): void {
    this.feedSub.unsubscribe();
  }
}

// helper functions
function pushEntries<T>(prev: any, data: any): T {
  if (!data) {
    return prev;
  }
  return Object.assign({}, prev, {
    feed: [...prev.feed, ...data.feed],
  });
}

