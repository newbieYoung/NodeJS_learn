/**
 * github爬虫
 */
'use strict';

let https = require("https");
let env = require('jsdom').env;
let fs = require('fs');
let _$ = require('jquery');
let moment = require('moment');

let url = 'https://github.com/newbieYoung/NewbieWebArticles';

let articles = [];
let data = '';
let req = https.request(url,function(res){

    res.setEncoding('utf-8');
    res.on('data',function(chunk){
        data += chunk;
    });
    res.on('end',function(){
        env(data,function(errors,window){
        	//解析文章列表获得所有文章的URL
            let $ = _$(window);
            let urls = [];
            let $items = $('div.file-wrap table.files tr.js-navigation-item');
            for(let i=0;i<$items.length;i++){
                let $item = $items.eq(i);
                let $a = $item.find('td.content span a');
                let href = $a.attr('href');
                let url =  `https://github.com${href}`;
                if(isHtml(url)){
                	urls.push(url);
                }
            }
            //解析文章并存入数据库
            for(let i=0;i<urls.length;i++){
            	let data = '';
            	let req = https.request(urls[i],function(res){
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
                                //默认数据
                                article.post_author = 1;
                                article.post_date = dateStr;
                                article.post_date_gmt = dateGmtStr;
                                article.post_status = 'publish';
                                article.comment_status = 'open';
                                article.ping_status = 'open';
                                article.post_parent = 0;
                                article.menu_order = 0;
                                article.post_type = 'post';
                                article.comment_count = 0;
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
                                
                                console.log(article);

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
            //console.log(urls);
            
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