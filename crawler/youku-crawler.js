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
let types = 0;
let offset = 1;//分页查询相关
let url = 'http://list.youku.com/category/show/c_97_a_%E6%97%A5%E6%9C%AC_r_2016_s_1_d_4.html?spm=a2h1n.8251845.filterPanel.5!2~1~3!6~A';

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
		let index = url.indexOf('.html?');
		let newUrl = url.substring(0,index)+'_p_'+offset+url.substring(index,url.length);
		let result = yield promiseRequestGet(newUrl,{timeout:timeout});
	    result = yield promiseEnv(result);
	    let $ = _$(result);
	    let $items = $('.yk-col4 .info-list li:nth-of-type(3)');
	    let $titles = $('.yk-col4 .info-list li.title a');
	    if($items.length<=0){
	    	logger.log('info','end');
	    	logger.log('info',types+'部');
	    	logger.log('info',total+'亿');
	    	next = false;
	    }else{
	    	offset ++;
	    	types += $items.length;
		    for(let i=0;i<$items.length;i++){
		    	let num = $items.eq(i).html();
		    	logger.log('info',$titles.eq(i).html()+' '+num);
		    	if(num.indexOf('万')!=-1){
		    		num = parseFloat(num)/10000; 
		    	}else{
		    		num = parseFloat(num);
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






