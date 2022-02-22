const dotenv = require('dotenv')
dotenv.config();
const client = require('./discord_rest')
const { DC_TOKEN, DC_ADMIN_ID, CONTROL_INTERVAL } = process.env;
const { generateEmbed } = require('./utils/embed')
const { PREFIX } = require('./credentials/discord_credentials.json')
const {
  parseNewsFromHTMLData,
  anyNewInformation,
  fetchHtmlDataFrom,
  getEmbedMsgForNews,
  getNotSentNews } = require('./utils/news.js')

const {
  connectToDB,
  getSubscriptions,
  saveSubscription,
  saveUnsubscription, } = require('./utils/db');

var news;
var subs;
client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity({
    type: 'WATCHING', name: '-help'
  })
  news = new Map(); // baseURL: news[]
  subs = new Map(); // baseURL: channelIDs 
  connectToDB();
  const DATA = await getSubscriptions();
  if (!DATA) {
    console.log("Problem occured while fetching data but continuing without old datas!")
  }
  DATA?.rows.forEach(async ({ channel_id, department_url }) => {
    if (news.get(department_url)) {
      subs.get(department_url).push(channelId)
    } else {
      news.set(department_url, parseNewsFromHTMLData(await fetchHtmlDataFrom(department_url)))
      subs.set(department_url, [channel_id]);
    }
  });

  setInterval(async () => {
    news.forEach(async (aNews, baseURL) => {
      let anyNew = await anyNewInformation(aNews, baseURL)
      if (anyNew) {
        let [notSentNews, lastFetchedNews] = getNotSentNews(aNews);
        news.set(baseURL, lastFetchedNews);
        subs.get(baseURL).forEach(channelId => {
          let notificationChannel = client.channels.cache.find(channel => channel.id === channelId);
          notSentNews.forEach(newsObj => {
            notificationChannel.send({ embeds: [getEmbedMsgForNews(newsObj, baseURL)] })
            .catch(err=>console.log(err))
          })
        })
      }
    })
  }, CONTROL_INTERVAL)

});

client.on('guildCreate', (guild) => {
  commandsFields = [
    { name: '-help', value: 'Get usage of commands' },
    { name: '/subscribe-news', value: 'Get notification whenever the subscribed department has new information' },
    { name: '/unsubscribe-news', value: 'Stops sending you notification for certain department' },
    { name: '-invite', value: "Get link to invite me (if you want to add some other servers)" }
  ]
  guild.systemChannel?.send({ embeds: [generateEmbed('Hi there!', "I'm here to help you, here are the usage of the commands:", commandsFields)] }).catch(err => console.log(err))   
})

client.on('messageCreate', async (message) => {
  if (!message.content.startsWith(PREFIX)) return;
  let args = message.content.slice(PREFIX.length).split(' ')
  let cmd = args[0];

  if (cmd === 'help') {
    commandsFields = [
      { name: '-help', value: 'Get usage of commands' },
      { name: '/subscribe-news [department]', value: 'Get notification whenever the subscribed department has new information' },
      { name: '/unsubscribe-news [department]', value: 'Stops sending you notification for certain department' },
      { name: '-invite', value: "Get link to invite me (if you want to add some other servers)" }
    ]
    message.channel.send({ embeds: [generateEmbed('MCBU News', "Here are the usage of the commands:", commandsFields)] })
      .catch(err => {
        console.log(err);
      })
  }

  if (cmd === 'notify-everyone') {
    if (!args[1]) {

      return;
    }
    let words = args.slice(1);
    let channelIds = new Array();
    subs.forEach((channelIdList) => {
      channelIds.push(...channelIdList)
    })

    let channels = client.channels.cache.filter(channel => channelIds.includes(channel.id))
    channels.forEach(channel => {
      channel.send({ 
        embeds: [
          generateEmbed(
            'Important!', 
            words.join(' '), 
            [{name: 'Sender', value: message.author.username}]
          )] 
      }).catch(err => {
          console.log(err)
        })
    })
  }

  if (cmd === 'member-count') {
    if (message.author.id != DC_ADMIN_ID) return;
    let sum = 0;
    client.guilds.cache.forEach(guild => {
      sum += guild.memberCount;
    })
    message.channel.send(`Currently we're providing service to approximately ${sum} people, Sir!`) 
    .catch(err => {
      console.log(err)
    })
  }

  if (cmd === 'invite') {
    let embedMsg = generateEmbed(
      'MCBU News',
      'I would be so happy, if you invite me to your server :)',
      [{ name: "Link: ", value: "[Invitation Link](https://discord.com/api/oauth2/authorize?client_id=944973383341338655&permissions=117760&scope=bot%20applications.commands)" }]
    )
    message.channel.send({ embeds: [embedMsg] })
      .catch(err => {
        console.log(err)
      })
  }


  if (cmd === "fetch-data") {
    if (!args[1]) {
      message.channel.send("You have to provide URL to fetch data!")
        .catch(err => {
          console.log(err)
        })
      return;
    }
    const news = await parseNewsFromHTMLData(await fetchHtmlDataFrom(args[1]))
    message.channel.send({ embeds: [getEmbedMsgForNews(news[0], args[1])] })
      .catch(err => {
        console.log(err)
      })
  }
})




client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (!interaction.memberPermissions.has('ADMINISTRATOR')) {
    await interaction.reply("Couldn't accomplished, missing permission ADMINISTRATOR!")
    return;
  }

  if (interaction.commandName === 'unsubscribe-news') {
    let url = interaction.options.getString('department');
    let channelId = interaction.channelId;
    let subsForURL = subs.get(url)

    if (subsForURL) {
      let indexOfChannelId = subsForURL.indexOf(channelId);
      saveUnsubscription(channelId, url)
      if (indexOfChannelId !== -1) {
        subsForURL.splice(indexOfChannelId, 1);

        // if there's no subscriber for department, don't control anymore 
        if (!subsForURL.length) {
          news.delete(url)
        }
        await interaction.reply(`You will no longer get news from \`${url}\``)
      }
    } else {
      await interaction.reply(`No subscription found for \`${url}\` in this channel!`);
    }
  }

  if (interaction.commandName === 'subscribe-news') {
    let baseURL = interaction.options.getString('department')
    let channelId = interaction.channelId

    if (news.get(baseURL)) {
      if (subs.get(baseURL).includes(channelId)) {
        await interaction.reply("You have already subscribed to "+ baseURL +" for this channel!")
        return;
      }
      subs.get(baseURL).push(channelId)
    } else {
      // Fetch current news for given URL, to don't send every old message at once!
      // news.set(baseURL, parseNewsFromHTMLData(await fetchHtmlDataFrom(baseURL)));

      // It should only send the news that published later than a news below
      // For test purposes
      news.set(baseURL, parseNewsFromHTMLData(await fetchHtmlDataFrom(baseURL)))
      subs.set(baseURL, [channelId]);
    }
    saveSubscription(channelId, baseURL)
    await interaction.reply(`This channel is successfuly subscribed to news of \`${baseURL}\``)
  }
});

client.login(DC_TOKEN);