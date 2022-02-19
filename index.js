const client = require('./discord_rest')
const { TOKEN, PREFIX, ADMIN_ID } = require('./credentials/discord_credentials.json')
const { 
  parseNewsFromHTMLData, 
  anyNewInformation, 
  fetchHtmlDataFrom, 
  getEmbedMsgForNews,
  getNotSentNews } = require('./utils/news.js')


var news;
var subs;
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  news = new Map(); // baseURL: news[]
  subs = new Map(); // baseURL: channelIDs 
  // client.guilds.
  setInterval(async () => {
    news.forEach(async (news, baseURL) => {
      let anyNew = await anyNewInformation(news, baseURL)
      if (anyNew) {
        let notSentNews = getNotSentNews(news);
        subs.get(baseURL).forEach( channelId => {
          let notificationChannel = client.channels.cache.find(channel => channel.id === channelId);
          notSentNews.forEach(newsObj => {
            notificationChannel.send({embeds: [getEmbedMsgForNews(newsObj, baseURL)]})
          })
        })
      }
    })
  }, 1000)

});

client.on('messageCreate', async (message) => {
  if (!message.content.startsWith(PREFIX)) return;
  if (message.author.id != ADMIN_ID) {
    message.channel.send('No permission!');
    return;
  }
  let args = message.content.slice(PREFIX.length).split(' ')
  let cmd = args[0];

  if (cmd === "fetch-data") {
    if (!args[1]) {
      message.channel.send("You have to provide URL to fetch data!");
      return;
    }
    const news = await parseNewsFromHTMLData(await fetchHtmlDataFrom(args[1]))
    message.channel.send({ embeds: [getEmbedMsgForNews(news[0], args[1])] })
  }

  if (cmd === 'subscribe-news') {
    if (!args[1]) {
      message.channel.send("You have to provide URL to subscribe!")
      return;
    }
    
    let baseURL = args[1];
    let channelId = message.channelId;
    // message.channel.send("If you're subscribing first time, you'll get every news at once, to calibrate the system...")

    if (subs.get(baseURL)?.includes(channelId)) {
      message.channel.send("You have already subscribed to this URL for this channel!")  
      return;
    } else {
      subs.set(baseURL,new Array());
      news.set(baseURL, []);
      subs.get(baseURL).push(channelId)
      message.channel.send("This channel is successfuly subscribed to news of " + baseURL)
    }

  }
})

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }
});

client.login(TOKEN);