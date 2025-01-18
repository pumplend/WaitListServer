const db = require("./utils/db")

async function test() {
    console.log(
        await db.getAllUsers()
    )
}

test()