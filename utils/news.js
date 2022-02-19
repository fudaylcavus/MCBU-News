const axios = require('axios').default
const cheerio = require('cheerio')
const { MessageEmbed } = require('discord.js')
const isURL = require('validator/lib/isURL')
let lastFetchedNews;


const getNotSentNews = (currentNewsData) => {
    let notSentNews = new Array();
    for (let i = 0; i < lastFetchedNews.length; i++) {
        if (i >= currentNewsData.length) {
            notSentNews = notSentNews.concat(lastFetchedNews.slice(i))
            break;
        }
        if (lastFetchedNews[i].description !== currentNewsData[i].description) {
            notSentNews.push(lastFetchedNews[i]);
        } else {
            break;
        }
    }
    console.log(notSentNews)
    return notSentNews;
}

const anyNewInformation = async (currentNewsData, baseURL) => {
    const news = parseNewsFromHTMLData(await fetchHtmlDataFrom(baseURL));
    lastFetchedNews = news;
    console.log(currentNewsData)
    if (!currentNewsData.length) return true;
    return !currentNewsData.every((newsObj, idx) => {
        console.log(newsObj.description, news[idx].description)
        return newsObj.description === news[idx].description;
    })
}

const getEmbedMsgForNews = ({ header, description, url, banner }, baseURL) => {
    let embedMsg = new MessageEmbed();
    if (isURL(url)) {
        embedMsg.setURL(url);
    }
    embedMsg.setTitle(header);
    if (isURL(baseURL)) {
        embedMsg.setImage(baseURL + banner);
    }
    embedMsg.setDescription(description ? description : "Hi!");
    embedMsg.setColor("#01bad8")
    embedMsg.setAuthor({ name: 'Taze Duyuru!!!' })
    embedMsg.setTimestamp()
    embedMsg.setFooter({ text: 'Created by Fudayl Cavus' });
    return embedMsg;
}

const parseNewsFromHTMLData = htmlData => {
    const news = [];
    const $ = cheerio.load(htmlData);
    const banner = $('#ucWebLogo_imgBanner').attr('src')
    $('li.CustomLi').each((idx, el) => {
        // console.log($(el).html())
        const url = $(el).find('a').attr('href')
        const header = $(el).find('.CustomLiHeader').html();
        const description = $(el).find('.CustomLiP').text();
        news.push({ url, header, description, banner })
    })
    return news;
}

const fetchHtmlDataFrom = async url => {
    let htmlData;
    await axios.get(url)
        .then(response => {
            htmlData = response.data;
        })
        .catch(err => {
            console.log(err)
        })
    return htmlData;
}

module.exports = {
    fetchHtmlDataFrom,
    parseNewsFromHTMLData,
    anyNewInformation,
    getEmbedMsgForNews,
    getNotSentNews
}