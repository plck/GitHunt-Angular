import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-comment',
  templateUrl: 'comment.component.html'
})
export class CommentComponent {
  @Input()
  public username: string;
  @Input()
  public userUrl: string;
  @Input()
  public content: string;
  @Input()
  public createdAt: Date;
}
