var MongoClient = require('mongodb').MongoClient;
require('dotenv').config()
    //DB name
const mainDB = "pumpmax_twitter"

const actionConfig = require("../modules/action/actionRules.json")

//Sheet name
const sUser = "users";
//DB struct
const userStruct = {
    id: 0,
    is_bot: false,
    first_name: '',
    last_name: '',
    username: '',
    language_code: '',
    createTime: 0,
    invite:""
}



function unique(arr) {
    var obj = {};
    return arr.filter(function(item, index, arr) {
        return obj.hasOwnProperty(typeof item + item) ? false : (obj[typeof item + item] = true)
    })
}

/**
 * User sytstem 
 */

async function newAccount(data,invite) {
    if ((await getAccountById(data.id)).length > 0) {
        return false;
    }
    data['invite'] = invite || 0;
    const pool = await MongoClient.connect(process.env.SQL_HOST)
    var db = pool.db(mainDB);
    var ret = await db.collection(sUser).insertOne(data);
    await pool.close();
    return ret;
}
async function getAccountById(uid) {
    const pool = await MongoClient.connect(process.env.SQL_HOST)
    var db = pool.db(mainDB);
    var ret = await db.collection(sUser).find({
        id: uid
    }).project({}).toArray();
    await pool.close();
    return ret;
}



module.exports = {
    newAccount,
    getAccountById,
    unique,
}