# simple-discord-trivia-bot
Simple trivia bot for discord, using a SQLITE database built from the [j-archive](https://www.j-archive.com/) (not included).

Based on the old hang-man styled trivia bots from the public channels of warcraft 3.

## Commands

	?trivia     Begins the trivia game.
	?stop       Ends the trivia game.
	?score      Prints out the current scores of this trivia round.
	?help       Prints out this message.

### Trivia
Begins a trivia session. Trivia automatically ends after no correct response has been given for `5` questions.

**Aliases:**

	?start

### Stop
Ends the current trivia session and prints scores.

**Aliases:**

	?end
    
### Score
Prints the scores of the current players.

### Help
Prints out the command list.