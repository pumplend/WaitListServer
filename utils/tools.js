function unique(arr) {
    var obj = {};
    return arr.filter(function(item, index, arr){
        return obj.hasOwnProperty(typeof item + item) ? false : (obj[typeof item + item] = true)
    })
}
function pathRouter(data)
{
    var ret ={
        command:"unknown",
        params : []
    }
    var tmp_0 = data.split(" ");
    if(tmp_0.length>0)
    {
        var tmp_1 = tmp_0[0].split("/");
        if(tmp_1.length>0)
        {
            ret.command = tmp_1[1]
        }
        for(var i = 1 ; i < tmp_0.length ; i ++)
        {
            ret.params.push(tmp_0[i])
        }
    }
    return ret;
}

function starRouter(data)
{
    var arr = [];
    data.forEach(e => {
        switch (e[0])
        {
            case "0" :
                arr.push(
                    {
                        "type":"export",
                        "data":e.substr(1)
                    }
                )
            break;

            case "1" :
                arr.push(
                    {
                        "type":"close",
                        "data":e.substr(1)
                    }
                )
            break;
            default:
            break;
        }
    });

    return arr;
}

var memoryStorage ={};

function getStorage(key)
{
    return memoryStorage[key];
}

function setStorage(key,data)
{
    memoryStorage[key]=data;
    return data;
}

function delStorage(key)
{
    delete memoryStorage[key]
}

module.exports = {
    unique,
    pathRouter,
    starRouter,
    getStorage,
    setStorage,
    delStorage,
}