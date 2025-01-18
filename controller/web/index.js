
require('dotenv').config();
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const redis = require("../../utils/redis")
const auth = require("./middleware/auth");
const tw = require('twitter-api-sdk')
const Client = tw.Client;
const twAuth = tw.auth;
const db = require("../../utils/db")
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

var logger = require('morgan');
app.use(logger('dev'));
app.use(logger(':method :url :status :res[content-length] - :response-time ms'));

const cors = require('cors');
app.use(cors())

app.listen(12001, async function() {
    console.log('web-server start')
})

const base_path = ""
async function sendErr(res, err) {
    if (!err) {
        err = "unknow error"
    }
    return await res.status(500).send({
        "code": 500,
        "error": err
    })
}

/**
 * Get
 */

//Ping
app.get(base_path+'/ping', auth.auth, async function(req, res) {
    res.status(200).send({
        "code": 200,
        "data": res.locals.auth
    })
})


app.get(base_path+'/manifest/pumpmax.json', async function(req, res) {
    res.status(200).send(
        {
            "url": "https://pumpmax.fun/",
            "name": "PUMPMAX",
            "iconUrl": "https://pumpmax.fun/logo.png",
            "termsOfUseUrl": "https://pumpmax.fun/",
            "privacyPolicyUrl": "https://pumpmax.fun/"
        }
    )
})

//Twitter login 
const STATE = "my-state";
const SITEBASE = "https://pumpmax.fun/"
const TESTNETBASE = "https://testnet.pumpmax.fun/"
const authClient = new twAuth.OAuth2User({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    callback: "https://pumpmax.fun/api/callback",
    scopes: ["tweet.read", "users.read"],
  });

app.get(base_path+"/callback", async function (req, res) {
    try {
          
      const { code, state } = req.query;
      // console.log(code,state)
      if (state !== STATE) return res.status(500).send("State isn't matching");
      const token = await authClient.requestAccessToken(String(code));
      // console.log("auth token :: ",token)
  
      authClient.token = token.token;
  
      const client = new Client(authClient);
      const users = await client.users.findMyUser();
      // console.log("users ::",users)
      if(users && users?.data && users.data?.id)
      {
        const userData = users?.data
        await db.newAccount(userData)
        const token = await auth.newkey(users.data.id)
        res.redirect(
          TESTNETBASE+"?id="+token
        )
      }else
      {
        return res.status(500).send("Login failed");
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send("Server error");
    }
  
  
  
  });
  
  app.get(base_path+"/login", async function (req, res) {
    const authUrl = authClient.generateAuthURL({
      state: STATE,
      code_challenge_method: "s256",
    });
    res.redirect(authUrl);
  });

const crypto = require("crypto");

function tgVerfiy(apiToken, telegramInitData) {
    try
    {
        // console.log(telegramInitData)
        const initData = new URLSearchParams(telegramInitData);
        // console.log(initData)
        initData.sort();
    
        const hash = initData.get("hash");
        initData.delete("hash");
    
        const dataToCheck = [...initData.entries()].map(([key, value]) => key + "=" + value).join("\n");
    
        const secretKey = crypto.createHmac("sha256", "WebAppData").update(apiToken).digest();
    
        const _hash = crypto.createHmac("sha256", secretKey).update(dataToCheck).digest("hex");
    
        return hash === _hash;
    }catch(e)
    {
        console.log(e)
        return false;
    }
}

//INIT
async function init() {
    await redis.init()
}

module.exports = {
    init
}