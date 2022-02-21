const { Pool } = require('pg')
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
})

const poolQuery = (queryString) => {
    let returnObj;
    pool.query(queryString, (err, result) => {
        if (err) {
            console.log(err.message);
            returnObj = err;
            return;
        } 
        returnObj = result.rows;
    })
    return returnObj;
}

const saveSubscription = (channelId, departmentURL) => {
    let queryString = `INSERT INTO subscription (channel_id, department_url) VALUES (${channelId}, ${departmentURL})`;
    return poolQuery(queryString);
   
}


const saveUnsubscription = (channelId, departmentURL) => {
    let queryString = `DELETE FROM subscription WHERE channel_id = ${channelId} AND department_url = ${departmentURL}`;
    return poolQuery(queryString);

}

const getSubscriptions = () => {
    let queryString = 'SELECT * FROM subscription';
    return poolQuery(queryString);
}

module.exports = {
    saveSubscription,
    saveUnsubscription,
    getSubscriptions
}