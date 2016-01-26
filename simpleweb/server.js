/**
 * 服务
 */
'use strict';
let http = require('http');

function start(route,handler){
	http.createServer(function(req,res){
		/* 组织数据 */
		let data = {};
		data.url = req.url;
		data.postData = '';

		req.setEncoding('utf8');
		/* 监听post请求 */
		req.addListener('data', function(postDataChunk) {
			data.postData += postDataChunk;
			console.log('Received POST data chunk :'+postDataChunk + ' at '+new Date());
	    });
		req.addListener("end", function() {
			route(handler, res, data);
	    });
	}).listen(9999);
	console.log('server has started at 9999');
}

exports.start = start;