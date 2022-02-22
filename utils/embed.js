const { MessageEmbed } = require('discord.js')
const isURL = require('validator/lib/isURL')

const getEmbedMsgForNews = ({ header, description, url, banner }, baseURL) => {
    let embedMsg = new MessageEmbed();
    if (isURL(url)) {
        embedMsg.setURL(url);
    }
    embedMsg.setTitle(header);
    if (isURL(baseURL) && banner) {
        embedMsg.setImage(baseURL + banner);
    }
    embedMsg.setDescription(description ? description : "Hi!");
    embedMsg.setColor("#01bad8")
    embedMsg.setAuthor({ name: 'Fresh News!!!' })
    embedMsg.setTimestamp()
    embedMsg.setFooter({ text: 'Created by Fudayl Cavus' });
    return embedMsg;
}

const generateEmbed = (title, description, fields, color='#01bad8') => {
    let messageEmbed = new MessageEmbed()
        .setTitle(title)
        .setDescription(description)
        .setTimestamp()
        .setColor(color)
    if (fields) 
        messageEmbed.addFields(...fields)
    return messageEmbed
}

module.exports = {
    getEmbedMsgForNews,
    generateEmbed
}