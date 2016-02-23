/**
 * http缓存相关
 */
'use strict';
let http = require('http');

http.createServer(function(request, response) {

	let now = new Date();
	let html = `<!DOCTYPE html>
				<html lang="en">
				<head>
					<meta charset="UTF-8">
					<title>hello</title>
				</head>
				<body>
					<p>hello http cache ${now}</p>
					<a href="//localhost:8888">click this link to test max-age</a>
				</body>
				</html>`;
	let lastModifedTime = new Date('2016-02-17');
	let etag = Math.random();//实体标识

	/**
	 * Expires、Cache-Control
	 * 控制浏览器是否直接从浏览器缓存中获取数据，Cache-Control优先级高；
	 * 而且由于浏览器机制刷新页面时会忽略Expires、Cache-Control，要测试Expires、Cache-Control只能点击url相同的链接（该链接是否新开tab页均可）
	 * Last-Modified、If-Modified-Since和ETag、If-None-Match
	 * 浏览器发送请求到服务器后判断文件是否已经修改过，如果没有修改过就返回304给浏览器，
	 * 通知浏览器直接从自己本地的获取对应的缓存信息，如果修改过那就整个数据重新发给浏览器。
	 */

	response.setHeader('Cache-Control', 'public max-age=60000');
	response.setHeader('Last-Modified',lastModifedTime);//设置最后修改时间
	response.setHeader('Etag',etag);//设置实体标识

	//console.log(request);
	let ifModifiedSince = request['headers']['if-modified-since'];
	let ifNoneMatch = request['headers']['if-none-match'];
	//let maxAge = request['rawHeaders'][5];
	
	if(ifNoneMatch){
		if(ifNoneMatch===etag){
			response.writeHead(304, {'Content-Type': 'text/html'});
		}else{
			response.writeHead(200, {'Content-Type': 'text/html'});
			response.write(html);
		}
	}else if(ifModifiedSince){
		/**
		 * If-Modified-Since是标准的HTTP请求头标签，在发送HTTP请求时，
		 * 把浏览器端缓存页面的最后修改时间一起发到服务器去，
		 * 服务器会把这个时间与服务器上实际文件的最后修改时间进行比较；
	     * 如果时间一致，那么返回HTTP状态码304（不返回文件内容），
	     * 客户端接到之后，就直接把本地缓存文件显示到浏览器中；
	     * 如果时间不一致，就返回HTTP状态码200和新的文件内容，
	     * 客户端接到之后，会丢弃旧文件，把新文件缓存起来，并显示到浏览器中。
		 */
		if(lastModifedTime.getTime()===new Date(ifModifiedSince).getTime()){
			response.writeHead(304, {'Content-Type': 'text/html'});
		}else{
			response.writeHead(200, {'Content-Type': 'text/html'});
			response.write(html);
		}
	}else{
		response.writeHead(200, {'Content-Type': 'text/html'});
		response.write(html);
	}
	
	response.end();

}).listen(8888);
