const sqlite = require('sqlite3').verbose();
const LETTERS_NUMBERS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const HINT_PERCENTAGE = 0.225;
const HINT_COUNT = 3;
const HINT_TIMER = 7500;
const QUESTION_TIMEOUT = 5;

const DB_PATH = './clues.db';
const QUESTION_COUNT = 375246 - 1;
const QUERY_STR = id => `SELECT clue, answer, category FROM documents, clues, categories WHERE documents.id = clues.id `
    + `AND categories.id = (SELECT category_id FROM classifications WHERE clue_id = ${id}) AND documents.id = ${id};`;
const randomQueryNum = () => Math.ceil(Math.random() * QUESTION_COUNT) + 1;


function Trivia(msg) {
    const channel = msg.channel;
    let qMsg = null;
    let qTimeout = 0;
    let hints = HINT_COUNT;
    let qAnswer = '';
    let category = '';
    let question = '';
    let scoreObj = {};
    let letters = [];
    let letterMax = 0;
    let unanswered = 0;
    let questions = {};
    this.complete = false;

    // Clean parsed data
    const cleanData = data => {
        category = data.category;
        question = data.clue.trim();
        qAnswer = data.answer.trim();

        let search = [/`/g, /\(.*\)/g];
        let replace = ["'", ""];
        for (let i = 0; i < search.length; ++i) {
            question = question.replace(search[i],replace[i]);
            qAnswer = qAnswer.replace(search[i],replace[i]);
        }
        question = question.trim();
        qAnswer = qAnswer.trim();
    }

    // Generates the hidden letters for the hint
    const generateHint = () => {
        letters = [];
        hints = HINT_COUNT;
        for (let i = 0; i < qAnswer.length; ++i) {
            const c = qAnswer.charAt(i);
            if (LETTERS_NUMBERS.includes(c.toLowerCase())) {
                letters.push(i);
            }
        }
        letterMax = letters.length;
    };

    const unhideLetters = () => {
        if (hints <= 0) {
            return false;
        } else {
            const hintsOut = (HINT_COUNT - hints--) + 1;
            const hintCount = Math.floor(letterMax * HINT_PERCENTAGE * hintsOut);
            const lettersShown = letterMax - letters.length;
            for (let i = lettersShown; i < hintCount; ++i)
                letters.splice(Math.floor(Math.random()*letters.length), 1);
            return true;
        }
    };

    const getHint = () => {
        let answer = '';
        let j = 0;
        for (let i = 0; i < qAnswer.length; ++i) {
            const c = qAnswer.charAt(i);
            if (i === letters[j]) {
                j++;
                answer += '-';
            } else {
                answer += c;
            }
        }
        return answer;
    }

    const printQuestion = () => {
        return `**Category:** \`${category}\`\n`
             + `**Question:** \`${question}\`\n`
             + `**Hint:** \`${getHint()}\``;
    };

    const printAnswer = () => {
        channel.send(`Time's up.\n**Answer:** \`${qAnswer}\`.`);
        qAnswer = '';
    };
    
    const editAnswer = () => {
        let done = !unhideLetters();
        if (done) {
            if (unanswered++ >= QUESTION_TIMEOUT) {
                channel.send('Trivia inactive. Timing out.')
                this.end();
            } else {
                printAnswer();
                getQuestion();
            }
        } else {
            if (qMsg !== null) {
                qMsg.edit(printQuestion());
            } else {
                channel.send(`**Hint:** ${getHint()}`);
            }
            qTimeout = setTimeout(() => {
                editAnswer();
            }, HINT_TIMER);
        }
    };

   const getQuestion = () => {
        generateQuestion(question => {
            cleanData(question);
            generateHint();
            unhideLetters();
            channel.send(printQuestion()).then(res => qMsg = res);
            qTimeout = setTimeout(() => {
                editAnswer();
            }, HINT_TIMER);
        });
    };

    const generateQuestion = callback => {
        const db = new sqlite.Database(DB_PATH, sqlite.OPEN_READONLY);
        let rand;
        do {
            rand = randomQueryNum();
        } while (questions[rand] !== undefined);
        questions[rand] = true;
        let question;
        db.serialize(() => {
            db.get(QUERY_STR(rand), (err, row) => {
                if (row === undefined) {
                    channel.send('Error getting questions from database.\nEnding trivia.');
                    this.end();
                } else {
                    callback(row);
                }
            });
        });
        db.close();
    };

    const addScore = (guild, author) => {
        if (scoreObj[author.id] === undefined) {
            scoreObj[author.id] = {score: 0};
        }
        const curr = scoreObj[author.id];
        scoreObj[author.id] = {
            score: curr.score + 1,
            name: guild.members.get(author.id).displayName
        }
    }

    this.answer = message => {
        if (message.content.toLowerCase() === qAnswer.toLowerCase()) {
            message.reply(`Correct!\n**Answer:** ${qAnswer}.`);
            addScore(message.guild, message.author);
            clearTimeout(qTimeout);
            getQuestion();
            unanswered = 0;
        }
    }

    this.score = () => {
        let scores = Object.values(scoreObj);
        if (scores.length > 0) {
            let out = '**Scores:**';
            scores = scores.sort((a, b) => b.score - a.score);
            let place = 1;
            for (let i = 0; i < scores.length; ++i) {
                if (i > 0 && scores[i-1].score > scores[i].score) {
                    place = i + 1;
                }
                out += `\n**${place}:** ${scores[i].name} (${scores[i].score})`;
            }
            channel.send(out);
        }
    }

    this.end = () => {
        clearTimeout(qTimeout);

        channel.send(`Trivia complete.\n**Answer:** ${qAnswer}.`);
        qAnswer = '';

        this.score();

        this.complete = true;
    }

    getQuestion();
}

exports.Trivia = Trivia;
