/**
 * github爬虫
 */
'use strict';

let https = require("https");
let env = require('jsdom').env;
let fs = require('fs');
let _$ = require('jquery');
let moment = require('moment');
let mysql = require('mysql');

let connection = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'http://young.com',
    database:'newbieweb'
});
connection.connect();

let url = 'https://github.com/newbieYoung/NewbieWebArticles';

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
        env(data,function(errors,window){
        	//解析文章列表获得所有文章的URL
            let $ = _$(window);
            let $items = $('div.file-wrap table.files tr.js-navigation-item');
            for(let i=0;i<$items.length;i++){
                let $item = $items.eq(i);
                let $a = $item.find('td.content span a');
                let href = $a.attr('href');
                let url =  `https://github.com${href}`;
                if(isHtml(url)){
                	githubData.urls.push(url);
                    githubData.dates.push($item.find('td.age span time').attr('datetime'));
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
            			env(data,function(errors,window){
            				let content = '';
            				let $ = _$(window);
            				//由于通过插件把markdown转换成html之后Github显示时还会处理一次，所以这里需要解析文章本身的html代码
            				let $content = $('div.file table.js-file-line-container');
            				let $trs = $content.find('tr');
            				for(let i=0;i<$trs.length;i++){
            					content += $trs.eq(i).text();
            				}
                            env(content,function(errors,window){
                                let $ = _$(window);
                                let $article = $('article.markdown-body');
                                let now = moment();
                                let dateStr = now.format('YYYY-MM-DD HH:mm:ss');
                                let dateGmtStr = now.add(-8, 'hours').format('YYYY-MM-DD HH:mm:ss');
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
                                article.post_excerpt = githubData.urls[i];//该文章远程url路径
                                article.to_ping = githubData.dates[i];//该文章远程更新时间
                                //部分字段不能为空
                                article.pinged = '';

                                githubData.articles.push(article);
                                
                                //所有文章已经爬取完毕，开始数据处理
                                if(i===githubData.urls.length-1){
                                    for(let j=0;j<githubData.articles.length;j++){
                                        let item = githubData.articles[j];
                                        let local;//本地数据
                                        connection.query('select * from wp_posts where post_excerpt = ?', [item.post_excerpt], function(err, result) {
                                            //console.log(err);
                                            //console.log(result);
                                            let iterator = result[Symbol.iterator]();
                                            let local = iterator.next().value;//查出来的结果应该有且只有一个，否则数据出现异常
                                            //不存在该文章，新增
                                            if(!local){
                                                connection.query('INSERT INTO wp_posts SET ?', item, function(err, result) {
                                                    //console.log(err);
                                                    //console.log(result);
                                                    if(result.insertId){
                                                        console.log(githubData.urls[i]+' inserted');
                                                        item.guid = item.guid+result.insertId;
                                                        item.ID = result.insertId;
                                                        connection.query('UPDATE wp_posts SET guid = ? WHERE id = ?',[item.guid,item.ID],function(err,result){//新增之后需要根据主键更新guid
                                                            console.log(githubData.urls[i]+'guid updated');
                                                            //console.log(err);
                                                            //console.log(result);
                                                        });
                                                        if(j===githubData.articles.length-1){
                                                            connection.end();
                                                        }
                                                    }
                                                });
                                            }else{
                                                //本地文章是最新
                                                if(local.to_ping === item.to_ping){
                                                    console.log(githubData.urls[i]+' no change');
                                                    if(j===githubData.articles.length-1){
                                                        connection.end();
                                                    }
                                                }else{
                                                    //重新设置需要更新的数据
                                                    connection.query(`UPDATE wp_posts SET post_title = ? ,
                                                                                          post_content = ? ,
                                                                                          post_name = ? ,
                                                                                          post_modified = ? ,
                                                                                          post_modified_gmt = ? ,
                                                                                          post_content_filtered = ? ,
                                                                                          to_ping = ?
                                                                                          WHERE ID = ?`, 
                                                    [item.post_title,item.post_content,item.post_name,item.post_modified,
                                                    item.post_modified_gmt,item.post_content_filtered,item.to_ping,local.ID] , 
                                                    function(err,result){
                                                        console.log(githubData.urls[i]+' updated');
                                                        //console.log(err);
                                                        //console.log(result);
                                                        if(j===githubData.articles.length-1){
                                                            connection.end();
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                        // connection.query('INSERT INTO wp_posts SET ?', item, function(err, result) {
                                        //     console.log(err);
                                        //     console.log(result);
                                        //     if(j===githubData.articles.length-1){
                                        //         connection.end();
                                        //     }
                                        // });
                                    }
                                }

                                // fs.writeFile('test.txt',article.post_content,function(err){
                                //     if (err) throw err;
                                //     console.log('已输出调试数据于test.txt文件中');
                                // });
                            });
            			})
            		});
            	});
            	req.end();
            }
            
        });
    });

});

req.end();

//根据URL判断某资源是否是html文件
function isHtml(url){
	if(url && typeof url === 'string'){
		let index = url.lastIndexOf('.html');
		let length = url.length;
		if(index!=-1){
			if(index===length-5){
				return true;
			}else{
				return false;
			}
		}else{
			return false;
		}
	}else{
		return false;
	}
}