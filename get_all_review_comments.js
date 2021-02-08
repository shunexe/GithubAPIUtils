require('dotenv').config();
const { Octokit } = require("@octokit/core");
const token = process.env.API_KEY;
const owner = process.env.OWNER;
const repo = process.env.REPO;
const assignee = process.env.ASSIGNEE;
const octokit = new Octokit({ auth: token });
const fs = require("fs");

(async ()=> {
    let resultArr =new Array();
    let next_url = "";
    let api_limit_remaining;
    await octokit.request('GET /search/issues', {
        q: `is:pr+state:closed+assignee:${assignee}+repo:${owner}/${repo}`,
    }).then((res) => {
        resultArr.push(res.data)
        api_limit_remaining = res.headers["x-ratelimit-remaining"]
        const matches = /\<([^<>]+)\>; rel\="next"/.exec(res.headers.link);
        if (matches != null) {
            //console.log("matches1", matches)
            console.log("次のURL発見！！")
            next_url = matches[1]
        } else {
            console.log("次のURLがありません")
            next_url = null;
            return;
        }
    }).catch((err) => {
        console.log(err)
    })
    while (next_url !== null) {
        await octokit.request(`${next_url}`, {}).then((res) => {
            resultArr.push(res.data)
            api_limit_remaining = res.headers["x-ratelimit-remaining"];
            const matches = /\<([^<>]+)\>; rel\="next"/.exec(res.headers.link);
            if (matches != null) {
                //console.log("matches2", matches)
                console.log("次のURL発見！！")
                next_url = matches[1]
            } else {
                console.log("次のURLがありません")
                next_url = null;
            }
        }).catch((err) => {
            console.log(err)
        })
    }
    console.log(resultArr)
    console.log(resultArr.length)
    const pulls = resultArr.map(data =>data.items)
    const result = [].concat.apply([],pulls);
    console.log(result.length);
    console.log("x-ratelimit-remaining",api_limit_remaining)
    const pull_numbers = result.map(data => data.number)
    //pull_numberをファイル出力
    // try {
    //     fs.writeFileSync("pull_numbers.text",pull_numbers.join(','));
    //     console.log('write end');
    // }catch(e){
    //     console.log(e);
    // }
    console.log(pull_numbers)
    console.log("PRの数",pull_numbers.length)
    let comments_raw =[]
    const pull_num_length = pull_numbers.length
    let count = 1;
    for(let pull_number of pull_numbers){//let i =0; i <10;i++){
        //console.log("PR_NUMBER",pull_numbers[i])
        //const pull_number = pull_numbers[i]
        console.log(`PR: ${count}/${pull_num_length}`)
        count ++;
        let review_ids = []
        await octokit.request(`GET /repos/${owner}/${repo}/pulls/${pull_number}/reviews`, {
            owner: owner,
            repo: repo,
            pull_number: pull_number
        }).then((res)=>{
            review_ids = res.data.map(data => data.id)
            console.log("review_ids 取得",review_ids)
        }).catch((err) => {
            console.log(err)
        })
        for(let review_id of review_ids){
            await octokit.request(`GET /repos/${owner}/${repo}/pulls/${pull_number}/reviews/${review_id}/comments`, {
                owner: owner,
                repo: repo,
                pull_number: pull_number
            }).then((res)=>{
                if(res.data.length !==0){
                    console.log(res.data[0].body)
                    comments_raw.push(res.data)
                }
            }).catch((err) => {
                console.log(err)
            })
        }
    }
    const comments = [].concat.apply([],comments_raw);
    try {
        fs.writeFileSync("./dst/comments.json",JSON.stringify(comments));
        console.log('write end');
    }catch(e){
        console.log(e);
    }

})();
