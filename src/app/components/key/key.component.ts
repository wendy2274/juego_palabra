import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MainService } from '../main/main.service';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

/** colores utilizados en variables.scss - para el estado de conjetura del juego */
enum ButtonColors {
  greenCorrect = "#6aaa64",
  yellowClose = "#c9b458",
  greyIncorrect = "#3a3a3c",
  greyUnused = "#818384"
}

@Component({
  selector: 'key',
  templateUrl: './key.component.html',
  styleUrls: ['./key.component.scss']
})
export class KeyComponent implements OnInit {
  @Input() key!: string;
  @Output() keyClick = new EventEmitter<string>();

  currentWord$ = this.mainService.currentWord$
  guessedWordsList$ = this.mainService.guessedWordsList$

  bgColor$!: Observable<ButtonColors>;

  constructor(private mainService: MainService) { }

  ngOnInit(): void {
    this.bgColor$ = combineLatest(this.currentWord$, this.guessedWordsList$).pipe(
      map(([word, guessedList]) => {
        const key = this.key.toLowerCase();
        const containsLetter = guessedList.some(guessedWord => guessedWord.includes(key));

      // la tecla es 'enter' o no se ha utilizado en una suposición, tiene un estado no utilizado
        if(key === "enter" || !containsLetter) return ButtonColors.greyUnused;

       // Si la clave se ha utilizado en una suposición pero no está en la palabra, obtiene un estado incorrecto
        if(!word.includes(key)) return ButtonColors.greyIncorrect;

        // mira cada palabra adivinada y encuentra dónde se ha usado la clave y si está en el lugar correcto
        const correctIndex = guessedList
          .map(guessedWord => {
            // encuentra todos los índices que contienen la clave
            const indices = [];
            const wordArray = guessedWord.split("");

            let idx = guessedWord.indexOf(key);
            while(idx !== -1) {
              indices.push(idx);
              idx = wordArray.indexOf(key, idx + 1);
            }

            return indices;
          })
          .flat()
          .filter(idx => idx !== -1)
          .some(idx => {
            return key === word[idx];
          })

        // si una instancia de la clave está en el lugar correcto en la palabra, devuelve el estado correcto
        if(correctIndex) return ButtonColors.greenCorrect;
        
        // si ninguna de las instancias clave está en el lugar correcto (pero en la palabra), devuelve el estado cerrado
        return ButtonColors.yellowClose;
      })
    )
  }

  onClick() {
    this.keyClick.emit(this.key.toLowerCase());
  }
}
