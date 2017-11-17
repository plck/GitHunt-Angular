import {Component, OnInit, OnDestroy} from '@angular/core';
import {Apollo} from 'apollo-angular';
import {Subscription} from 'rxjs/Subscription';

import {CurrentUserQuery} from './profile.model';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.component.html'
})
export class ProfileComponent implements OnInit, OnDestroy {
  public loading = true;
  public currentUser: any;

  private currentUserSub: Subscription;

  constructor(private apollo: Apollo) {
  }

  public ngOnInit(): void {
    this.currentUserSub = this.apollo.watchQuery({
      query: CurrentUserQuery,
    }).valueChanges.subscribe(({data, loading}) => {
      this.currentUser = data['currentUser'];
      this.loading = loading;
    });
  }

  public ngOnDestroy(): void {
    this.currentUserSub.unsubscribe();
  }
}
