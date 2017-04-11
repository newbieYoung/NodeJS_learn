/**
 * 腾讯视频简单爬虫
 */
'use strict';

let request = require('request');
let env = require('jsdom').env;
let timeout = 10000;
let _$ = require('jquery');

//日志
let winston = require('winston');
let logger = new (winston.Logger)({
    transports: [
        //new (winston.transports.File)({ filename: `/tmp/github-crawler-${uniqueStr}.log` }),
        new (winston.transports.Console)()
    ]
});

let next = true;
let total = 0;//总播放次数
let offset = 0;//分页查询相关
let url = 'http://v.qq.com/x/list/tv?iyear=859&iarea=819&offset=';

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


function crawler(offset){
	co(function *(){
		logger.log('info','page '+offset);
		let result = yield promiseRequestGet(url+offset,{timeout:timeout});
	    result = yield promiseEnv(result);
	    let $ = _$(result);
	    let $items = $('.list_item .num');
	    let $titles = $('.list_item .figure_title a');
	    if($items.length<=0){
	    	logger.log('info','end');
	    	logger.log('info',total+'亿');
	    	next = false;
	    }else{
	    	offset += $items.length;
		    for(let i=0;i<$items.length;i++){
		    	let num = $items.eq(i).html();
		    	logger.log('info',$titles.eq(i).html()+' '+num);
		    	if(num.indexOf('万')!=-1){
		    		num = parseInt(num)/10000; 
		    	}else{
		    		num = parseInt(num);
		    	}
		    	total = total+num;
		    }	
	    }
	}).then(function(){
		if(next){
			logger.log('info','page '+offset);
			crawler(offset);
		}
	}).catch(function(error){
	    logger.log('error',error);
	});
}

crawler(offset);






