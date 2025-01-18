const db = require("../../utils/db");

const redis = require("../../utils/redis")

const MAX_KEY_LENGTH = 5;

const md5 = require('js-md5');

const uuid = require('uuid');

const merchantApiKeyStruct = {
    uid: "",
    key: "", //RandomKey :: APIKEY:UID+timestamp+Random(6) toString(36)
    createTime: 0,
}

/**
 * Merchant auth system
 */

function keygen(uid) {
    return md5("AK" + uid.toString(36) + Date.now().toString(36) + (Number((Math.random() * Math.pow(10, 6)).toFixed(0))).toString(36));
}

async function keyLengthCheck(uid) {
    if ((await getAuthKeyByUid(uid)).length >= MAX_KEY_LENGTH) {
        return false;
    } else {
        return true;
    }
}

async function newAuthKey(uid) {
    if (await keyLengthCheck(uid)) {
        const key = keygen(uid)
        await db.newMerchantApiKey(uid, key)
        return key;
    }
}

async function getAuthKeyByKey(key) {
    return db.getApiKeyMerchant(key)
}

async function getAuthKeyByUid(uid) {
    return db.getMerchantApiKey(uid)
}


/**
 * User auth
 */


async function newUserAuthKey(uid) {
    const key = uuid.v4();
    return await redis.newUserAuthKey(uid, key)
}

async function getUserAuthKey(uid) {
    const key = uuid.v4();
    return await redis.newUserAuthKey(uid, key)
}

async function authUserAuthKey(key) {
    return await redis.verfiUserAuthKey(key)
}

module.exports = {
    keygen,
    newAuthKey,
    getAuthKeyByKey,
    getAuthKeyByUid,

    newUserAuthKey,
    getUserAuthKey,
    authUserAuthKey,

}