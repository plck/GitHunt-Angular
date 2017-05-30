import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Apollo, ApolloQueryObservable} from 'apollo-angular';
import {Subscription} from 'rxjs/Subscription';
import {Subject} from 'rxjs/Subject';

import 'rxjs/add/operator/toPromise';

import {commentQuery, submitCommentMutation, subscriptionQuery} from './comments-page.model';
import {Comment} from '../../schema-types';

// helper function checks for duplicate comments, which we receive because we
// get subscription updates for our own comments as well.
// TODO it's pretty inefficient to scan all the comments every time.
// maybe only scan the first 10, or up to a certain timestamp
function isDuplicateComment(newComment: Comment, existingComments: Comment[]): boolean {
  return newComment.id !== null && existingComments.some(comment => newComment.id === comment.id);
}

export const COMMENTS_PER_QUERY = 10;

@Component({
  selector: 'app-comments-page',
  templateUrl: 'comments-page.component.html'
})
export class CommentsPageComponent implements OnInit, OnDestroy {
  public newComment: Comment;
  public noCommentContent: boolean;
  public entry: any;
  public currentUser: any;
  public loading = true;
  public loadingMoreComments = false;
  public errors: any[];

  private repoName: Subject<string> = new Subject<string>();
  private entryObs: ApolloQueryObservable<any>;
  private entrySub: Subscription;
  private subscriptionRepoName: string;
  private subscriptionSub: Subscription;
  private offset = 0;

  constructor(private route: ActivatedRoute,
              private apollo: Apollo) {
    this.noCommentContent = false;
  }

  public ngOnInit(): void {
    // Fetch
    this.entryObs = this.apollo.watchQuery({
      query: commentQuery,
      variables: {
        repoFullName: this.repoName,
        limit: COMMENTS_PER_QUERY,
        offset: this.offset
      },
    });

    // Subscribe
    this.entrySub = this.entryObs.subscribe(({data, loading}) => {
      this.entry = data.entry;
      this.currentUser = data.currentUser;
      this.loading = loading;
    });

    // Listen to the route
    this.route.params.subscribe(params => {
      const repoName = `${params['org']}/${params['repoName']}`;

      this.loading = true;
      this.repoName.next(repoName);

      // subscribe to comments
      if (this.subscriptionSub) {
        this.subscriptionSub.unsubscribe();
        this.subscriptionSub = undefined;
      }

      this.subscribe(repoName);
    });
  }

  public loadMore(): void {
    if (this.entry.comments && this.entry.comments.length < this.entry.commentCount) {
      this.loadingMoreComments = true;
      this.offset += COMMENTS_PER_QUERY;

      this.entryObs.fetchMore({
        variables: {
          limit: COMMENTS_PER_QUERY,
          offset: this.offset
        },
        updateQuery: (prev, {fetchMoreResult}) => {
          // push the new data
          const data: Object = pushComments<Object>(prev, {fetchMoreResult});
          // change the status
          this.loadingMoreComments = false;

          return data;
        }
      });
    }
  }

  public submitForm(): void {
    this.noCommentContent = false;

    const repositoryName: string = this.entry.repository.full_name;

    if (!this.newComment) {
      this.noCommentContent = true;
    } else {
      this.apollo.mutate({
        mutation: submitCommentMutation,
        variables: {
          repoFullName: repositoryName,
          commentContent: this.newComment,
        },
        // Make an optimistic response
        optimisticResponse: optimisticComment(this.currentUser, this.newComment),
        // Update the query result
        updateQueries: {
          Comment: (prev, {mutationResult}: any) => {
            const newComment: Comment = mutationResult.data.submitComment;
            const data: Object = pushNewComment<Object>(prev, newComment);
            this.offset++;

            return data;
          }
        }
      })
        .toPromise()
        .then(() => this.newComment = null)
        .catch(errors => this.errors = errors);
    }
  }

  public ngOnDestroy(): void {
    this.entrySub.unsubscribe();
    this.subscriptionSub.unsubscribe();
  }

  private subscribe(repoName: string): void {
    this.subscriptionRepoName = repoName;

    this.subscriptionSub = this.apollo.subscribe({
      query: subscriptionQuery,
      variables: {repoFullName: repoName},
    }).subscribe({
      next: (data) => {
        const newComment: Comment = data.commentAdded;

        this.entryObs.updateQuery((previousResult) => pushNewComment<Object>(previousResult, newComment));
      },
      error(err: any): void {
        console.error('err', err);
      }
    });
  }
}


// helper functions


function optimisticComment(postedBy: any, content: Comment): Object {
  return {
    __typename: 'Mutation',
    submitComment: {
      __typename: 'Comment',
      id: null,
      postedBy,
      content,
      createdAt: +new Date,
    }
  };
}

function pushComments<T>(prev: any, {fetchMoreResult}: any): T {
  const newComments: Comment[] = fetchMoreResult.entry.comments;
  const commentCount: number = fetchMoreResult.entry.commentCount;

  if (!fetchMoreResult.entry.comments) {
    return prev;
  }

  const newEntry: Comment[] = Object.assign({}, prev.entry, {
    comments: [...prev.entry.comments, ...newComments],
    commentCount
  });

  return Object.assign({}, prev, {
    entry: newEntry,
  });
}

function pushNewComment<T>(prev: any, newComment: Comment): T {
  if (isDuplicateComment(newComment, prev.entry.comments)) {
    return prev;
  }

  const newEntry: Comment[] = Object.assign({}, prev.entry, {
    comments: [newComment, ...prev.entry.comments],
    commentCount: (prev.entry.commentCount || 0) + 1
  });

  return Object.assign({}, prev, {
    entry: newEntry,
  });
}
