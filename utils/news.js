const axios = require('axios').default
const cheerio = require('cheerio')
const { getEmbedMsgForNews } = require('./embed')
let lastFetchedNews;


const getNotSentNews = (currentNewsData) => {
    let notSentNews = new Array();
    for (let i = 0; i < lastFetchedNews.length; i++) {
        if (currentNewsData.some(news => news.description === lastFetchedNews[i].description)) {
            break
        } else {
            notSentNews.push(lastFetchedNews[i])
        } 
    }
    return [notSentNews, lastFetchedNews];
}

const anyNewInformation = async (currentNewsData, baseURL) => {
    const news = parseNewsFromHTMLData(await fetchHtmlDataFrom(baseURL));
    lastFetchedNews = news;
    if (!currentNewsData.length) return true;
    return currentNewsData[0].description != news[0].description;
}
// https://discord.com/api/oauth2/authorize?client_id=944973383341338655&permissions=2147699712&scope=bot

const parseNewsFromHTMLData = htmlData => {
    const news = [];
    const $ = cheerio.load(htmlData);
    // banner image is optional, if you don't have any image on website
    // delete the line below 
    const banner = $('#ucWebLogo_imgBanner').attr('src')

    // If you parse url, header, description for your own website
    // Everthing should still work fine!, only change these lines below
    $('li.CustomLi').each((idx, el) => {
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