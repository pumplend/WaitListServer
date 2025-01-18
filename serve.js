
const webview = require("./controller/web/index");

async function init()
{
  try{
    await webview.init()
  }catch(e)
  {
    console.error(e)
  }

}

init()