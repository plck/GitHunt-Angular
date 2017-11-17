import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {Apollo} from 'apollo-angular';

import {submitRepositoryMutation} from './new-entry.model';

@Component({
  selector: 'app-new-entry',
  templateUrl: 'new-entry.component.html'
})
export class NewEntryComponent {
  public error: string;
  public repoFullName: string;

  constructor(private router: Router,
              private apollo: Apollo) {
  }

  public submitForm(): void {
    if (!this.repoFullName) {
      return;
    }

    this.error = null;

    this.apollo.mutate({
      mutation: submitRepositoryMutation,
      variables: {
        repoFullName: this.repoFullName,
      },
    })
      .subscribe({
        next: () => this.router.navigate(['/feed/new']),
        error: (error) => this.error = error.message,
      });
  }
}
