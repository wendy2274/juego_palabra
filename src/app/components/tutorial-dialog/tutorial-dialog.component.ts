import { Component, OnInit } from '@angular/core';

export interface IWordExample {
  word: string;
  index: number;
  status: string;
}

@Component({
  selector: 'app-tutorial-dialog',
  templateUrl: './tutorial-dialog.component.html',
  styleUrls: ['./tutorial-dialog.component.scss']
})
export class TutorialDialogComponent implements OnInit {
  public wordExamples: IWordExample[] = [
    {
      word: "campo",
      index: 0,
      status: "correct"
    },
    {
      word: "pollo",
      index: 1,
      status: "close"
    },
    {
      word: "barco",
      index: 3,
      status: "incorrect"
    }
  ]

  
  constructor() { }

  ngOnInit(): void {
  }

}
