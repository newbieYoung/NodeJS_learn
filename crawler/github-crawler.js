/**
 * github爬虫
 */
'use strict';

let request = require('request');
let env = require('jsdom').env;
let _$ = require('jquery');
let moment = require('moment');
let timeout = 10000;
let fs = require('fs');
let child_process = require('child_process');

//普通常量
let url = 'https://github.com/newbieYoung/NewbieWebArticles';//远程地址
let timeFormatStr = 'YYYY-MM-DD hh:mm:ss';
let prevStr = 'nb_';
let uniqueStr = `${process.pid}-${Date.now()}`;
let delayTimes = 5*60*1000;//每个更新任务间隔1小时

//日志
let winston = require('winston');
let logger = new (winston.Logger)({
    transports: [
        //new (winston.transports.File)({ filename: `/tmp/github-crawler-${uniqueStr}.log` }),
        new (winston.transports.Console)()
    ]
});

//数据库连接池
let mysql = require('mysql');
let pool = mysql.createPool({
    connectionLimit : 1,
    host            : 'rm-wz94279gwn3ygk50ho.mysql.rds.aliyuncs.com',
    user            : 'young',
    password        : 'newbie79923327',
    database:'newbieweb'
});

//捕获所有未处理的异常
process.on('uncaughtException', function(error) {
    logger.log('error',`Error caught in uncaughtException event:${error}`);
});

//generator相关
let co = require('co');

function promiseRequestGet(url,params){
    return new Promise((resolve, reject) => {
        request.get(url,params,function(error,response,body){
            if(error){
                reject(error);
            }else{
                resolve(body);
            }
        });
    });
}

function promiseEnv(body){
    return new Promise((resolve, reject) => {
        env(body,function(error,window){
            if(error){
                reject(error);
            }else{
                resolve(window);
            }
        });
    });
}

function promisePoolConnection(){
    return new Promise((resolve,reject) => {
        pool.getConnection(function(error, connection) {
            if(error){
                reject(error);
            }else{
                resolve(connection);
            }
        });
    });
}

function promiseQuery(connection,sql,params){
    return new Promise((resolve,reject) => {
        connection.query(sql,params, function(error, result) {
            if (error){
                reject(error);
            }else{
                resolve(result);
            }
        });
    });
}

//根据URL判断某资源是否是html文件
function isHtml(url){
    if(url && typeof url === 'string'){
        return url.endsWith('.html');
    }else{
        return false;
    }
}

//判断数组中是否存在空元素
function isArrayHasNull(array){
    for(let i=0;i<array.length;i++){
        if(!array[i]){
            return true;
        }
    }
    return false;
}

//校验文章，通过返回true，失败返回false
function checkArticles(articles){
    let num = 0;
    for(let i=0;i<articles.length;i++){
        let item = articles[i];
        if(!item.post_excerpt){
            logger.log('error',`${item.post_title} post_excerpt=${item.post_excerpt}`);
            num++;
        }
    }
    if(num>0){
        return false;
    }else{
        return true;
    }
}

//完成一次数据处理
function finish(connection,j){
    //每次数据操作时清除掉未发布的文章
    if(j===0){
        connection.query(`delete from ${prevStr}wp_posts where post_status != ?`, ['publish'],function(error, result){
            if (error){
                logger.log('info','delete unpublished articles error');
                logger.log('error',error);
            }else{
                logger.log('info','delete unpublished articles success');
            }
            //logger.log('info',process.memoryUsage());//输出内存信息
            connection.release();
            logger.log('info',`connection release at ${moment().format(timeFormatStr)}`);
        });
    }else{
        //logger.log('info',process.memoryUsage());//输出内存信息
        connection.release();
        logger.log('info',`connection release at ${moment().format(timeFormatStr)}`);
    }
    // //生成内存快照
    // let file = `/tmp/github-crawler-${process.pid}-${Date.now()}.heapsnapshot`;
    // heapdump.writeSnapshot(file, function(error){
    //     if (error){
    //         logger.log('info',`Wrote snapshot: ${file} error`);
    //         logger.log('error',error);
    //     }else{
    //         logger.log('info',`Wrote snapshot: ${file}`);
    //     };
    // });
}

//再次爬取
function crawlerAgain(){
    logger.log('info',`crawler will run again ${delayTimes} mseconds later`);
    setTimeout(crawler,delayTimes);
}

//爬虫
function crawler(){
	logger.log('info','--------------------------------------');

    let githubData = {
        dates:[],
        urls:[],
        articles:[]
    };
   
    co(function *() {
        let promiseArr = [];
        //爬取项目主页
        logger.log('info',`strat ${moment().format(timeFormatStr)}`);
        let result = yield promiseRequestGet(url,{timeout:timeout});
        //解析项目主页获得所有文章的URL
        result = yield promiseEnv(result);
        let $ = _$(result);
        let $items = $('.file-wrap table.files tr.js-navigation-item');
        if($items.length<=0){
            result.close();
            logger.log('error','github website html construct has changed');
        }else{
            for(let i=0;i<$items.length;i++){
                let $item = $items.eq(i);
                let $a = $item.find('td.content span a');
                let href = $a.attr('href');
                let url =  `https://github.com${href}`;
                if(isHtml(url)){
                    githubData.urls.push(url);
                    githubData.dates.push($item.find('td.age span').children().eq(0).attr('datetime'));
                }
            }
            //爬取具体文章页面
            for(let i=0;i<githubData.urls.length;i++){
                promiseArr.push(promiseRequestGet(githubData.urls[i],{timeout:timeout}));
            }
            result.close(); 

            result = yield Promise.all(promiseArr);
            promiseArr = [];
            //解析具体文章页面
            for(let i=0;i<result.length;i++){
                promiseArr.push(promiseEnv(result[i]));
            }
            result = yield Promise.all(promiseArr);
            promiseArr = [];
            for(let i=0;i<result.length;i++){
                let content = '';
                let $ = _$(result[i]);
                //由于通过插件把markdown转换成html之后Github显示时还会处理一次，所以这里需要解析文章本身的html代码
                let $content = $('div.file table.js-file-line-container');
                let $trs = $content.find('tr');
                for(let z=0;z<$trs.length;z++){
                    content += $trs.eq(z).text();
                }
                promiseArr.push(promiseEnv(content));
                result[i].close();
            }
            result = yield Promise.all(promiseArr);
            promiseArr = [];
            for(let i=0;i<result.length;i++){
                let $ = _$(result[i]);
                let $article = $('article.markdown-body');
                let now = moment();
                let dateStr = now.format(timeFormatStr);
                let dateGmtStr = now.add(-8, 'hours').format(timeFormatStr);
                let article = {};
                //整理数据
                article.post_author = 1;
                article.post_date = dateStr;
                article.post_date_gmt = dateGmtStr;
                article.post_status = 'publish';
                article.comment_status = 'open';
                article.ping_status = 'open';
                article.menu_order = 0;
                article.post_type = 'post';
                article.post_title = $article.children().eq(0).text();
                $article.children().eq(0).remove();//移除标题
                article.post_content = $article.html();
                if(typeof article.post_content == 'string'){
                    article.post_content = article.post_content.replace(/\n      \n        \n        /g, '\n');
                }
                article.post_name = encodeURIComponent(article.post_title);
                article.post_modified = dateStr;
                article.post_modified_gmt = dateGmtStr;
                article.post_content_filtered = article.post_title;
                article.post_parent = 0;
                article.guid = 'http://newbieweb.lione.me/?p=';
                article.menu_order = 0;
                article.post_type = 'post';
                article.comment_count = 0;
                //不知道这两个字段本来的含义，但是这里用来保存远程url路径和远程更新时间，用来判断是新增还是更新
                article.post_excerpt = `${githubData.urls[i]}(${githubData.dates[i]})`;//该文章远程url路径(该文章远程更新时间)
                //部分字段不能为空
                article.pinged = '';
                //由于回调函数的执行不一定是按照先后顺序来的，所以这里不能使用push否则会导致文章次序混乱
                //githubData.articles.push(article);
                githubData.articles[i] = article;
                result[i].close();
            }
            //所有文章已经爬取完毕并且校验完成，开始数据处理
            if(!isArrayHasNull(githubData.articles)&&checkArticles(githubData.articles)&&githubData.articles.length===githubData.urls.length){
                logger.log('info','articles ready');
                for(let j=0;j<githubData.articles.length;j++){
                    let item = githubData.articles[j];
                    if(item.post_excerpt!=`${githubData.urls[j]}(${githubData.dates[j]})`){
                        logger.log('error','the articles of link and content and update time can not match each other');
                    }else{
                        //数据库连接池的使用方式是先获取连接然后再使用，操作完成之后再释放否则会出现内存泄漏的情况
                        result = yield promisePoolConnection();
                        let connection = result;
                        logger.log('info',`get connection at ${moment().format(timeFormatStr)}`);

                        result = yield promiseQuery(connection,`select * from ${prevStr}wp_posts where post_excerpt like ?`,[`${githubData.urls[j]}%`]);
                        let iterator = result[Symbol.iterator]();
                        let local = iterator.next().value;//查出来的结果应该有且只有一个，否则数据出现异常

                        //不存在该文章，新增
                        if(!local){
                            result = yield promiseQuery(connection,`INSERT INTO ${prevStr}wp_posts SET ?`,item);
                            if(result.insertId){
                                logger.log('info',`${item.post_excerpt} insert success`);
                                item.guid = item.guid+result.insertId;
                                item.ID = result.insertId;
                                result = yield promiseQuery(connection,`UPDATE ${prevStr}wp_posts SET guid = ? WHERE id = ?`,[item.guid,item.ID]);
                                logger.log('info',`${item.post_excerpt} guid update success`);
                                finish(connection,j);
                            }else{
                                logger.log('error','the new article does not have insertId');
                                finish(connection,j);
                            }
                        }else{
                            //本地文章是最新
                            if(local.post_excerpt === item.post_excerpt){
                                logger.log('info',`${item.post_excerpt} no change`);
                                finish(connection,j);
                            }else{
                                //重新设置需要更新的数据
                                result = yield promiseQuery(connection,`UPDATE ${prevStr}wp_posts SET post_title = ? ,
                                                                      post_content = ? ,
                                                                      post_name = ? ,
                                                                      post_modified = ? ,
                                                                      post_modified_gmt = ? ,
                                                                      post_content_filtered = ? ,
                                                                      post_excerpt = ?
                                                                      WHERE ID = ?`,[item.post_title,item.post_content,item.post_name,item.post_modified,
                                item.post_modified_gmt,item.post_content_filtered,item.post_excerpt,local.ID]);
                                logger.log('info',`${item.post_excerpt} update success`);
                                finish(connection,j);
                            }
                        }
                    }
                }
                //更新全部文章的sitemap相关信息
                let newConnection = yield promisePoolConnection();
                let postArticles = yield promiseQuery(newConnection,`select guid,post_modified_gmt from ${prevStr}wp_posts where post_status = 'publish'`);//查询公开发布状态的所有文章
                let innerContent = '';
                for(let i=0;i<postArticles.length;i++){
                    let item = postArticles[i];
                    innerContent += `
                    <url>
                        <loc>${item.guid}</loc>
                        <lastmod>${item.post_modified_gmt}</lastmod>
                        <changefreq>weekly</changefreq>
                        <priority>1.0</priority>
                    </url>
                    `;
                }
                let sitemapContent = `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
    ${innerContent}
</urlset>`;
                fs.writeFileSync('sitemap.xml', sitemapContent);
                logger.log('info','sitemap.xml updated');
                //更新robot.txt
                let robotContent = `User-agent: *
Disallow:
Sitemap: http://newbieweb.lione.me/sitemap.xml`;
                fs.writeFileSync('robot.txt',robotContent);
                logger.log('info','robot.txt updated');
                child_process.execSync('scp ./sitemap.xml ./robot.txt root@120.24.166.108:/documents/newbieweb');
                logger.log('info','sitemap.xml and robot.txt uploaded');
            }
        }
    }).then(function(){
        crawlerAgain();
    }).catch(function(error){
        logger.log('error',error);
        crawlerAgain();
    });
}

//立即执行
crawler();