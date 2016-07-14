/**
 * github爬虫
 */
'use strict';

let https = require("https");
let env = require('jsdom').env;
let fs = require('fs');
let _$ = require('jquery');
let moment = require('moment');

//普通常量
let url = 'https://github.com/newbieYoung/NewbieWebArticles';//远程地址
let timeFormatStr = 'YYYY-MM-DD hh:mm:ss';
let prevStr = 'nb_';
let uniqueStr = `${process.pid}-${Date.now()}`;

//日志
let winston = require('winston');
let logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: `/tmp/github-crawler-${uniqueStr}.log` })
    ]
});

//监听垃圾回收
let memwatch = require('memwatch-next');//not work
memwatch.on('leak', function(info) {
    logger.log('error',`memwatch leak: ${info}`);
});
let heapdump = require('heapdump');

//数据库连接池
let mysql = require('mysql');
let pool = mysql.createPool({
    connectionLimit : 1,
    host            : 'rm-wz94279gwn3ygk50ho.mysql.rds.aliyuncs.com',
    user            : 'young',
    password        : 'newbie79923327',
    database:'newbieweb'
});

//爬虫
function crawler(){
    try{
        logger.log('info','--------------------------------------');
        logger.log('info',`strat ${moment().format(timeFormatStr)}`);

        let githubData = {
            dates:[],
            urls:[],
            articles:[]
        }
        let req = https.request(url,function(res){

            let data = '';

            res.setEncoding('utf-8');
            res.on('data',function(chunk){
                data += chunk;
            });
            res.on('end',function(){
                env(data,function(err,window){
                    if (err){
                        logger.log('error',err);
                    }else{
                        //解析文章列表获得所有文章的URL
                        let $ = _$(window);
                        let $items = $('div.file-wrap table.files tr.js-navigation-item');
                        if($items.length<=0){
                            logger.log('error','github website html construct has changed.');
                        }
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
                        //解析文章并存入数据库
                        for(let i=0;i<githubData.urls.length;i++){
                            let data = '';
                            let req = https.request(githubData.urls[i],function(res){
                                res.setEncoding('utf-8');
                                res.on('data',function(chunk){
                                    data += chunk;
                                });
                                res.on('end',function(){
                                    env(data,function(err,window){
                                        if (err){
                                            logger.log('error',err);
                                        };
                                        let content = '';
                                        let $ = _$(window);
                                        //由于通过插件把markdown转换成html之后Github显示时还会处理一次，所以这里需要解析文章本身的html代码
                                        let $content = $('div.file table.js-file-line-container');
                                        let $trs = $content.find('tr');
                                        for(let z=0;z<$trs.length;z++){
                                            content += $trs.eq(z).text();
                                        }
                                        env(content,function(err,window){
                                            if (err){
                                                logger.log('error',err);
                                            };
                                            let $ = _$(window);
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
                                            article.post_content = article.post_content.replace(/\n      \n        \n        /g, '\n');
                                            article.post_name = encodeURIComponent(article.post_title);
                                            article.post_modified = dateStr;
                                            article.post_modified_gmt = dateGmtStr;
                                            article.post_content_filtered = article.post_title;
                                            article.post_parent = 0;
                                            article.guid = 'http://www.newbieweb.me/?p=';
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
                            
                                            //所有文章已经爬取完毕并且校验完成，开始数据处理
                                            if(!isArrayHasNull(githubData.articles)&&checkArticles(githubData.articles)&&githubData.articles.length===githubData.urls.length){
                                                //logger.log('info',githubData.urls);
                                                for(let j=0;j<githubData.articles.length;j++){
                                                    let item = githubData.articles[j];
                                                    if(item.post_excerpt!=`${githubData.urls[j]}(${githubData.dates[j]})`){
                                                        logger.log('error','the articles of link and content and update time can not match each other.');
                                                    }
                                                    let local;//本地数据

                                                    //数据库连接池的使用方式是先获取连接然后再使用，操作完成之后再释放否则会出现内存泄漏的情况
                                                    pool.getConnection(function(err, connection) {
                                                        if(err){
                                                            logger.log('error',err);
                                                            connection.release();
                                                        }else{
                                                            logger.log('info',`get connection at ${moment().format(timeFormatStr)}`);
                                                            connection.query(`select * from ${prevStr}wp_posts where post_excerpt like ?`, [`${githubData.urls[j]}%`], function(err, result) {
                                                                if (err){
                                                                    logger.log('error',err);
                                                                    connection.release();
                                                                }else{
                                                                    let iterator = result[Symbol.iterator]();
                                                                    let local = iterator.next().value;//查出来的结果应该有且只有一个，否则数据出现异常
                                                                    //不存在该文章，新增
                                                                    if(!local){
                                                                        connection.query(`INSERT INTO ${prevStr}wp_posts SET ?`, item, function(err, result) {
                                                                            if (err){
                                                                                logger.log('error',err);
                                                                                connection.release();
                                                                            }else{
                                                                                if(result.insertId){
                                                                                    logger.log('info',item.post_excerpt+' inserted');
                                                                                    item.guid = item.guid+result.insertId;
                                                                                    item.ID = result.insertId;
                                                                                    connection.query(`UPDATE ${prevStr}wp_posts SET guid = ? WHERE id = ?`,[item.guid,item.ID],function(err,result){//新增之后需要根据主键更新guid
                                                                                        if (err){
                                                                                            logger.log('error',err);
                                                                                        }else{
                                                                                            logger.log('info',`${item.post_excerpt} guid updated`);
                                                                                        }
                                                                                        finish(connection,j);
                                                                                    });
                                                                                }else{
                                                                                    logger.log('error','the new article does not have insertId.');
                                                                                    connection.release();
                                                                                }
                                                                            }
                                                                        });
                                                                    }else{
                                                                        //本地文章是最新
                                                                        if(local.post_excerpt === item.post_excerpt){
                                                                            logger.log('info',`${item.post_excerpt} no change`);
                                                                            finish(connection,j);
                                                                        }else{
                                                                            //重新设置需要更新的数据
                                                                            connection.query(`UPDATE ${prevStr}wp_posts SET post_title = ? ,
                                                                                                                  post_content = ? ,
                                                                                                                  post_name = ? ,
                                                                                                                  post_modified = ? ,
                                                                                                                  post_modified_gmt = ? ,
                                                                                                                  post_content_filtered = ? ,
                                                                                                                  post_excerpt = ?
                                                                                                                  WHERE ID = ?`, 
                                                                            [item.post_title,item.post_content,item.post_name,item.post_modified,
                                                                            item.post_modified_gmt,item.post_content_filtered,item.post_excerpt,local.ID] , 
                                                                            function(err,result){
                                                                                if (err){
                                                                                    logger.log('error',err);
                                                                                }else{
                                                                                    logger.log('info',`${item.post_excerpt} updated`);
                                                                                }
                                                                                finish(connection,j);
                                                                            });
                                                                        }
                                                                    }
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                            }
                                            // free memory associated with the window
                                            window.close();
                                        });
                                        // free memory associated with the window
                                        window.close();
                                    })
                                });
                            });
                            req.end();
                        }
                    }
                    // free memory associated with the window
                    window.close();
                });
            });
        });
        
        req.on('error', function(e) {
            logger.log('error',`https request ${url} error:${e}`);
        });

        req.end();
    }catch(e){
        logger.log('error',e);
    }
}

//完成一次数据处理
function finish(connection,j){
    //每次数据操作时清除掉未发布的文章
    if(j==0){
        connection.query(`delete from ${prevStr}wp_posts where post_status != ?`, ['publish'],function(err, result){
            if (err){
                logger.log('error',err);
            }else{
                logger.log('info','delete unpublished articles successfully');
            }
            connection.release();
        });
    }else{
        connection.release();
    }
    //生成内存快照
    // let file = `/tmp/github-crawler-${process.pid}-${Date.now()}.heapsnapshot`;
    // heapdump.writeSnapshot(file, function(err){
    //     if (err){
    //         logger.log('error',err);
    //     }else{
    //         logger.log('info',`Wrote snapshot: ${file}`);
    //     };
    // });
    logger.log('info',`connection release at ${moment().format(timeFormatStr)}`);
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

//根据URL判断某资源是否是html文件
function isHtml(url){
    if(url && typeof url === 'string'){
        return url.endsWith('.html');
    }else{
        return false;
    }
}

//定时任务
// let later = require('later');
// let sched = later.parse.recur()
//             .every(2).minute();//每2分钟执行一次
//             //.every(2).hour();//每2小时执行一次
// later.setInterval(crawler, sched);
setInterval(crawler,1000*60*2);

//立即执行
crawler();
