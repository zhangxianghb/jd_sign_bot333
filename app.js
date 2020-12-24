// version v0.0.2
// create by ruicky
// detail url: https://github.com/ruicky/jd_sign_bot

const exec = require('child_process').execSync;
const fs = require('fs');
const rp = require('request-promise');
const download = require('download');

// 公共变量
const KEY = process.env.JD_COOKIE;
const serverJ = process.env.PUSH_KEY;
const DualKey = process.env.JD_COOKIE_2;

const AGENTID = process.env.AGENTID;
const CORPID = process.env.CORPID;
const CORPSECRET = process.env.CORPSECRET;


async function downFile() {
    // const url = 'https://cdn.jsdelivr.net/gh/NobyDa/Script@master/JD-DailyBonus/JD_DailyBonus.js'
    const url = 'https://raw.githubusercontent.com/NobyDa/Script/master/JD-DailyBonus/JD_DailyBonus.js';
    await download(url, './');
}

async function changeFile() {
    let content = await fs.readFileSync('./JD_DailyBonus.js', 'utf8')
    content = content.replace(/var Key = ''/, `var Key = '${KEY}'`);
    if (DualKey) {
        content = content.replace(/var DualKey = ''/, `var DualKey = '${DualKey}'`);
    }
    await fs.writeFileSync('./JD_DailyBonus.js', content, 'utf8')
}

async function sendNotify(text, desp) {
    const options = {
        uri: `https://sc.ftqq.com/${serverJ}.send`,
        form: {text, desp},
        json: true,
        method: 'POST'
    }
    await rp.post(options).then(res => {
        console.log(res)
    }).catch((err) => {
        console.log(err)
    })
}

async function getAccessToken(corpid, corpsecret) {
    var uri = 'https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=' + corpid + '&corpsecret=' + corpsecret;
    return rp(uri).then(function (res) {
        var json = JSON.parse(res)
        return json.access_token;
    }).catch(function (err) {
        console.err(err);
    });
}

async function sendNotifyWX(text, accessToken) {
    const options = {
        uri: 'https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=' + accessToken,
        body: {
            touser: '@all',
            toparty: '@all',
            totag: '@all',
            msgtype: 'text',
            agentid: AGENTID,
            text: {
                content: text
            }
        },
        json: true,
        method: 'POST'
    }

    await rp.post(options).then(res => {
        console.log(res)
    }).catch((err) => {
        console.log(err)
    })
}


async function start() {
    if (!KEY) {
        console.log('请填写 key 后在继续')
        return
    }
    // 下载最新代码
    await downFile();
    console.log('下载代码完毕')
    // 替换变量
    await changeFile();
    console.log('替换变量完毕')
    // 执行
    await exec("node JD_DailyBonus.js >> result.txt");
    console.log('执行完毕')

    if (serverJ) {
        const path = "./result.txt";
        let content = "";
        if (fs.existsSync(path)) {
            content = fs.readFileSync(path, "utf8");
        }
        var a = content.indexOf('【签到概览】')
        var b = content.indexOf('【其他总计】')
        var text = content.substring(a, b);
        console.log(text)
        try {
            let datetime = new Date();
            let dt = datetime.toLocaleString();

            let accesstoken = await getAccessToken(CORPID, CORPSECRET);
            //去掉回车换行
            var replace = content.substring(a, content.length)
            replace = replace.substring(0, 180)
            replace = replace + " ... ..." + '\r\n' + dt
            await sendNotifyWX("淑芬：\r\n"+replace, accesstoken);
        } catch (err) {
            console.log(err)
        }
        await sendNotify(text, content);
    }
}

start()
