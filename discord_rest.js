const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { TOKEN, APP_ID } = require('./credentials/discord_credentials.json')
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const getDeptOptions = (option) => {
  option.setName('department')
        .setDescription('Department URL to subscribe news')
        .addChoice('Hasan Ferdi Turgutlu Teknoloji Fakültesi', 'https://hfttf.mcbu.edu.tr/')
        .addChoice('Erasmus+', 'https://erasmus.mcbu.edu.tr/')
        .addChoice('Mühendislik Fakültesi', 'https://muhendislik.mcbu.edu.tr/')
        .addChoice('Bilgisayar Mühendisliği', 'https://bilgisayarmuh.mcbu.edu.tr/')
        .addChoice('Biyomühendislik', 'https://biyomuh.mcbu.edu.tr/')
        .addChoice('Elektrik Elektronik Mühendisliği', 'https://elektrikelektronikmuh.mcbu.edu.tr/')
        .addChoice('Endüstri Mühendisliği', 'https://endustrimuh.mcbu.edu.tr/')
        .addChoice('Gıda Mühendisliği', 'https://gidamuh.mcbu.edu.tr/')
        .addChoice('İnşaat Mühendisliği', 'https://insaatmuh.mcbu.edu.tr/')
        .addChoice('Makine Muhendisliği', 'https://makinemuh.mcbu.edu.tr/')
        .addChoice('Metalurji ve Malzeme Mühendisliği', 'https://malzememuh.mcbu.edu.tr/')
        .setRequired(true)
  return option;
}

const subscribeCommand = new SlashCommandBuilder()
  .setName('subscribe-news')
  .setDescription('Subscribe to the news of any MCBU department')
  .addStringOption(getDeptOptions)

const unsubCommand = new SlashCommandBuilder()
  .setName('unsubscribe-news')
  .setDescription('Unsubscribe to the news of certain MCBU department')
  .addStringOption(getDeptOptions)

const commands = [
  subscribeCommand.toJSON(),
  unsubCommand.toJSON()
]

const rest = new REST({ version: '9' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(APP_ID, "443038754417147906"),
      { body: commands },
    );

    // await rest.put(
    //   Routes.applicationCommands("504398839625809951"),
    //   { body: commands}
    // )

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

module.exports = client;