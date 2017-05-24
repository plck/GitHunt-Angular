import {DocumentNode} from 'graphql';

import gql from 'graphql-tag';

import {fragments as VoteButtonsFragments} from './vote-buttons.model';
import {fragments as RepoInfoFragments} from '../shared/repo-info.model';

export const fragments: {
  [key: string]: DocumentNode
} = {
  entry: gql`
    fragment FeedEntry on Entry {
      id
      commentCount
      repository {
        full_name
        html_url
        owner {
          avatar_url
        }
      }
      ...VoteButtons
      ...RepoInfo
    }

    ${VoteButtonsFragments['entry']}
    ${RepoInfoFragments['entry']}
  `,
};
