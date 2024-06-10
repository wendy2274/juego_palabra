import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { wordBank } from "../../wordBank";
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StatisticsDialogComponent } from '../statistics-dialog/statistics-dialog.component';

interface KeyState {
  guessedWordsList: string[];
  guessedWord: string;
  currentWord:  string;
  currentRow: number;
}

const initialState = {
  guessedWordsList: [],
  guessedWord: "",
  currentWord: "",
  currentRow: 0
}

enum GameRules {
  MaxGuesses = 6,
  WordLength = 5,
  RowAmount = 6
}

@Injectable({
  providedIn: 'root'
})
export class MainService {

// sujetos de comportamiento, utilizados para albergar elos objetos de estado
  private readonly _state$ = new BehaviorSubject<Readonly<KeyState>>(initialState);

  protected get state() {
    return this._state$.getValue();
  }

  readonly guessedWordsList$ = this._state$.pipe(
    filter((state) => !!state.guessedWordsList),
    map((state) => state.guessedWordsList)
  )

  readonly guessedWord$ = this._state$.pipe(
    map(state => state.guessedWord)
  )
  
  readonly currentRow$ = this._state$.pipe(
    map(state => state.currentRow)
  )

  readonly currentWord$ = this._state$.pipe(
    filter((state) => !!state.currentWord),
    map(state => state.currentWord)
  )

  constructor(
    private dialog: MatDialog,
    private snackbar: MatSnackBar
  ) {
    this.loadConfig();
    this.generateGame();
  }

  /**
   *Al cargar el juego, verificamos si tenemos algo en el almacenamiento local para rastrear el historial de juego de nuestro usuario.
   */
   private loadConfig() {
    const wordleData = localStorage.getItem("wordleData");
    if(!!wordleData) return;

    localStorage.setItem("usedWordsList", JSON.stringify([]))

    this.generateWord();

    const initWordleGame = JSON.stringify({
      gamesPlayed: 0,
      gamesWon: 0,
      winStreak: 0,
      maxStreak: 0,
      guessAmountForWin: {},
      currentWord: this.state.currentWord,
      guessedWords: []
    });

    localStorage.setItem("wordleData", initWordleGame);
  }

  /**
   * Después de enviar un juego, guarda el juego y las estadísticas actualizadas del usuario en el almacenamiento local.
   */
  private submitGame(gameWon: boolean, guessAmount: number) {
    const wordleData = JSON.parse(localStorage.getItem("wordleData") as string);

    let { gamesPlayed, gamesWon, winStreak, maxStreak, guessAmountForWin } = wordleData;

    let guessDistribution;

    if(!!gameWon) {
      guessDistribution = {
        ...guessAmountForWin,
      }
      guessDistribution[guessAmount] 
        ? guessDistribution[guessAmount] = guessDistribution[guessAmount] + 1 
        : guessDistribution[guessAmount] = 1;
    } else {
      guessDistribution = {...guessAmountForWin};
    }

    const updatedData = JSON.stringify({
      gamesPlayed: gamesPlayed + 1,
      gamesWon: gameWon ? gamesWon + 1 : gamesWon,
      winStreak: gameWon ? winStreak + 1 : 0,
      maxStreak: (gameWon && winStreak + 1 > maxStreak) ? winStreak + 1 : maxStreak, 
      guessAmountForWin: guessDistribution,
      currentWord: this.state.currentWord,
      guessedWords: this.state.guessedWordsList
    });

    localStorage.setItem("wordleData", updatedData);
  }

  private saveBeforeLeaving() {
    const wordleData = JSON.parse(localStorage.getItem("wordleData") as string);

    let { gamesPlayed, gamesWon, winStreak, maxStreak, guessAmountForWin } = wordleData;

    const updatedData = JSON.stringify({
      gamesPlayed: gamesPlayed,
      gamesWon: gamesWon,
      winStreak: winStreak,
      maxStreak: maxStreak,
      guessAmountForWin: guessAmountForWin,
      currentWord: this.state.currentWord,
      guessedWords: this.state.guessedWordsList
    });

    localStorage.setItem("wordleData", updatedData);
  }

  

  /*** generar juego, actualizar el estado con el historial del último juego del usuario (ya sea terminado o sin terminar)
   */
  private generateGame() {
    const wordleData = JSON.parse(localStorage.getItem("wordleData") as string);

    let { currentWord, guessedWords } = wordleData;

    this._state$.next({
      ...this.state,
      currentWord: currentWord,
      guessedWordsList: guessedWords,
      currentRow: guessedWords.length
    });
  }

  private generateWord() {
    const word = wordBank[Math.floor(Math.random() * wordBank.length)];

    const usedWordsList = JSON.parse(localStorage.getItem("usedWordsList") as string);

    if(usedWordsList.includes(word)) {
      this.generateWord();
    } else {
     // actualizar la lista de palabras usadas en el almacenamiento local con la nueva palabra
      const updatedUsedWordsList = JSON.stringify([...usedWordsList, word])
      localStorage.setItem("usedWordsList", updatedUsedWordsList);

      //actualizar estado con nueva palabra
      this.updateCurrentWord(word);
    }
  }

  /**
   * cuando un usuario abandona juego, guarda el progreso del juego
   */
  public saveCurrentGame() {
    this.saveBeforeLeaving();
  }

 // acciones, configuraciones de estado de otros componentes

  /**
   * agrega la letra en la que se hizo clic a la palabra de la fila actual
   * @param key La tecla alfabetica presionada en el teclado de la aplicación
   */
  public addLetterToWord(key: string) {
    this.setAddedLetter(key);
  }

  /**
   * elimina la última letra de la fila actual
   */
  public removeLetter() {
    this.setRemoveLetter();
  }

  /**
   * Ingresa/envía la palabra de la fila actual si está completa
   */
  public enterWord() {
    this.submitWord();
  }

  /**
   *Abre el cuadro de diálogo de estadísticas con las estadísticas de juegos anteriores del usuario.
   */
  public openStatisticsDialog() {
    this.openStatsDialog();
  }

  /**
   *restablece por completo las estadísticas del usuario
   */
  public resetStats() {
    // reset state
    this.resetState();
    
    // configurar un nuevo juego con nuevos datos de almacenamiento local
    this.loadConfig();
    this.generateGame();

    this.snackbar.open("Your game was reset!", "Close", {
      panelClass: ["game-result-notif"],
      duration: 8000
    });
  }


  /**
   *Añade una letra a la palabra adivinada por el usuario.
   */
  protected setAddedLetter(key: string) {
    if(this.state.guessedWord.length === GameRules.WordLength) return;

    // actualiza la palabra actual con la nueva letra
    const updatedWord = this.state.guessedWord + key
    
   // actualiza la 'palabra actual' en el estado
    this._state$.next({
      ...this.state,
      guessedWord: updatedWord
    });
  }

  /**
   * eliminar letra de la palabra adivinada por el usuario
   */
  protected setRemoveLetter() {
    if(this.state.guessedWord.length === 0) return;

  // actualiza la palabra actual eliminando la última letra
    const { guessedWord } = this.state;
    const updatedWord = guessedWord.substring(0, guessedWord.length - 1);
 
    // actualiza la 'palabra actual' en el estado
    this._state$.next({
      ...this.state,
      guessedWord: updatedWord
    });
  }

  /**
   * * envía la palabra actual si la palabra adivinada está completa
*    agrega la palabra completa a la lista de palabras adivinadas, restablece la palabra adivinada y pasa a la siguiente fila
   */
  protected submitWord() {
    const { guessedWord, currentWord, currentRow, guessedWordsList } = this.state

    if(guessedWord.length !== GameRules.WordLength) return;

    const validWord = wordBank.includes(guessedWord);
    if(!validWord) {
      this.snackbar.open("Not in word list", "Close", {
        panelClass: ["game-result-notif"],
        duration: 8000
      });

      return;
    };
    
    const gameResult = guessedWord === currentWord;
    const guessAttemptNum = currentRow + 1;

    // if we guess the correct word or we are making our last submit / guess - the game is done
    if(!!gameResult || guessAttemptNum === GameRules.RowAmount) {
      // open dialog box with stats, congrats message, update local storage with win, games played, set a new word, reset state
      this.resetState();
      this.generateWord();
      this.submitGame(gameResult, guessAttemptNum);

      this.openStatsDialog();
      this.openSnackbar(gameResult, currentWord);
      
      return;

    } else {
      // otherwise update state
      const nextRow = currentRow + 1;

      this._state$.next({
        guessedWordsList: [...guessedWordsList, guessedWord],
        guessedWord: "",
        currentWord: currentWord,
        currentRow: nextRow
      });
    }
  }

  private openStatsDialog(): void {
    const wordleData = JSON.parse(localStorage.getItem("wordleData") as string);
    const { gamesPlayed, gamesWon, winStreak, maxStreak, guessAmountForWin } = wordleData;

    this.dialog.open(StatisticsDialogComponent, {
      position: {
        top: "50px"
      },
      maxHeight: "calc(100vh - 75px)",
      data: {
        gamesPlayed: gamesPlayed,
        gamesWon: gamesWon,
        winStreak: winStreak,
        maxStreak: maxStreak,
        guessAmountForWin: guessAmountForWin
      }
    })
  }

  private openSnackbar(result: boolean, word: string): void {
    let message = result ? 
      `Correct! You correctly guessed the word, ${word.toUpperCase()}` : 
      `Sorry, you did not guess the correct word, ${word.toUpperCase()}`;

    const resultClassName = result ? "correct-guess" : "incorrect-guess";

    this.snackbar.open(message, "Close", {
      panelClass: ["game-result-notif", resultClassName],
      duration: 8000
    });
  }

  /**
   * update the word to guess, in state
   * @param newWord randomly generated word from word bank
   */
  protected updateCurrentWord(newWord: string) {
    this._state$.next({
      ...this.state,
      currentWord: newWord
    });
  }

  /**
   * after a game has finished, reset game state
   */
  protected resetState() {
    this._state$.next({
      ...this.state,
      guessedWordsList: [],
      guessedWord: "",
      currentWord: "",
      currentRow: 0
    });
  }
}
