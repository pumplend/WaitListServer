const kg = require('../../../modules/auth/index')

async function auth(req, res, next) {
    const token = req.headers.token;
    const authUser = await kg.authUserAuthKey(token);
    console.log("authUser",authUser,token)
    if (authUser) {
        res.locals.auth = String(authUser);
        next();
    } else {
        res.status(401).send({
            code: 401,
            error: "Permission deny . Please check if API-KEY correct ."
        });
    }
}

async function newkey(uid) {
    return await kg.newUserAuthKey(uid);
}

module.exports = {
    auth,
    newkey
}