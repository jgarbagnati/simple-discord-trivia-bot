const Discord = require('discord.js');
const Trivia = require('./trivia.js');
const client = new Discord.Client();
const trivia = {};

const TRIGGER = '?'

const HELP = 
`**Trivia Bot Commands:**
\`\`\`
${TRIGGER}trivia Begins the trivia game.
${TRIGGER}stop   Ends the trivia game.
${TRIGGER}score  Prints out the current scores of this trivia round.
${TRIGGER}help   Prints out this message.
\`\`\`
`;

client.on('message', msg => {
    if (msg.content.length <= 0) return;
    const id = `${msg.guild.id}+${msg.channel.id}`;
    
    if (trivia[id] === undefined || trivia[id].complete) {
        switch(msg.content.toLowerCase()) {
            case `${TRIGGER}trivia`:
            case `${TRIGGER}start`:
                trivia[id] = new Trivia.Trivia(msg);
                break;
            case `${TRIGGER}help`:
                msg.reply(HELP);
                break;
            case `${TRIGGER}stop`:
            case `${TRIGGER}end`:
            case `${TRIGGER}score`:
                msg.reply('Trivia is not currently running.');
            default:
                break;
        }
    } else {
        switch (msg.content.toLowerCase()) {
            case `${TRIGGER}stop`:
            case `${TRIGGER}end`:
                trivia[id].end();
                delete trivia[id];
                break;
            case `${TRIGGER}trivia`:
            case `${TRIGGER}start`:
                msg.reply('Trivia is already running.');
                break;
            case `${TRIGGER}help`:
                msg.reply(HELP);
                break;
            case `${TRIGGER}score`:
                trivia[id].score();
                break;
            default:
                trivia[id].answer(msg);
                break;
        }
    }
});

// Put secret discord key here
client.login('');
