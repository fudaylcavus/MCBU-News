const { Pool } = require('pg')
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false } 
})

const connectToDB = async () => {
    await pool.connect().then(async () => {
        console.log("Succesffuly connected to DB!")
        await pool.query(`
        CREATE TABLE IF NOT EXISTS subscription (
        channel_id varchar(25) NOT NULL,
        department_url varchar(50) NOT NULL,
        UNIQUE (channel_id, department_url)
        )`)
        .catch(err => {
            console.log(err)
        })
    }).catch(err => console.log(err))
}

const poolQuery = async (queryString) => {
    return await pool.query(queryString).catch(err => console.log(err))
}

const saveSubscription = (channelId, departmentURL) => {
    let queryString = `INSERT INTO subscription (channel_id, department_url) VALUES ('${channelId}', '${departmentURL}');`;
    return poolQuery(queryString);

}


const saveUnsubscription = (channelId, departmentURL) => {
    let queryString = `DELETE FROM subscription WHERE channel_id = '${channelId}' AND department_url = '${departmentURL}'`;
    return poolQuery(queryString);

}

const getSubscriptions = () => {
    let queryString = 'SELECT * FROM subscription';
    return poolQuery(queryString);
}

module.exports = {
    connectToDB,
    saveSubscription,
    saveUnsubscription,
    getSubscriptions
}