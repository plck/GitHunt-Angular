import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Apollo, QueryRef} from 'apollo-angular';
import {Subscription} from 'rxjs/Subscription';
import {Subject} from 'rxjs/Subject';

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

  // private type: Subject<string> = new Subject<string>();
  private offset = 0;
  private itemsPerPage = 10;
  private feedSub: Subscription;
  private feedRef: QueryRef<any>;

  constructor(
    private route: ActivatedRoute,
    private apollo: Apollo
  ) {}

  public ngOnInit(): void {
    // Listen to the route
    this.route.params.subscribe((params) => {
      this.loading = true;
      const type = (params['type'] || 'top').toUpperCase();

      // Fetch
      this.feedRef = this.apollo.watchQuery({
        query: feedQuery,
        variables: {
          type,
          offset: this.offset,
          limit: this.itemsPerPage
        },
        fetchPolicy: 'network-only',
      });

      // Subscribe
      if (this.feedSub) {
        this.feedSub.unsubscribe();
      }
      this.feedSub = this.feedRef
        .valueChanges
        .subscribe(({data, loading}) => {
          this.feed = data.feed;
          this.currentUser = data.currentUser;
          this.loading = loading;
        });
    });
  }

  public onVote(event: OnVoteEvent): void {
    this.apollo.mutate({
      mutation: voteMutation,
      variables: {
        repoFullName: event.repoFullName,
        type: event.type,
      },
    }).subscribe();
  }

  public fetchMore(): void {
    this.feedRef.fetchMore({
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

