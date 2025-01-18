/**
 * This controller is to build a api request system for wallet
 */
const root = process.cwd();
require('dotenv').config();
var querystring = require('querystring');
var express = require('express');
const fs = require("fs");
var app = express();
var bodyParser = require('body-parser');
const modules = require("../../modules/index")
const redis = require("../../utils/redis")
const qr = require('qrcode');
const b58 = require("b58")
const action = require("../../modules/action/index")
const auth = require("./middleware/auth");
const tw = require('twitter-api-sdk')
const Client = tw.Client;
const twAuth = tw.auth;

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

const base_path = "/api"
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
const authClient = new twAuth.OAuth2User({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    callback: "https://pumpmax.fun/api/callback",
    scopes: ["tweet.read", "users.read"],
  });

app.get(base_path+"/callback", async function (req, res) {
    try {
          
      const { code, state } = req.query;
      console.log(code,state)
      if (state !== STATE) return res.status(500).send("State isn't matching");
      const token = await authClient.requestAccessToken(String(code));
      console.log("auth token :: ",token)
  
      authClient.token = token.token;
  
      const client = new Client(authClient);
      const users = await client.users.findMyUser();
      console.log(users)
      if(users && users?.data && users.data?.id)
      {
        const userData = users?.data
        const token = await auth.newkey(users.data.id)
        // console.log("⚠ The invite Data",req.body.invite,parseInt(req.body.invite,16))
        // res.status(200).send({
        //     "code": 200,
        //     "token": token,
        //     "uid":users.data.id,
        //     "data": await action.userLogin(userData,userData.id,0)
        // })
        await action.userLogin(userData,userData.id,0)
        res.redirect(
            SITEBASE+"?tk="+token
        )
      }else
      {
        return res.status(500).send("Login failed");
      }
      // res.redirect("/tweets");
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

/**
 *Wallet connection logic
 *
 * 1.Dapp generate a random key (32 length)
 * 
 * 2.Dapp params key into webapp link 
 * 
 * 3.Dapp loop call api interface with random Key for callback/webhook
 * 
 * 4.User open Webapp with generated link
 * 
 * 5.Tonspack server update information of callback address
 */

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