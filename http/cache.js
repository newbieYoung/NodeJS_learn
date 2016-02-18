/**
 * http缓存相关
 */
'use strict';
let http = require('http');

http.createServer(function(request, response) {

	let lastModifedTime = new Date('2016-02-17');
	let etag = Math.random();//实体标识

	response.setHeader('Cache-Control', 'public');//允许缓存
	response.setHeader('Last-Modified',lastModifedTime);//设置最后修改时间
	response.setHeader('Etag',etag);//设置实体标识
	/**
	 * max-age
	 * 当客户端发送的请求中Cache-Control属性中指定了max-age；
	 * 如果缓存资源的有效时间比该max-age小，则缓存服务器直接返回缓存资源；
	 * 如果缓存资源的有效时间比该max-age大，则缓存服务器需要将该请求转发给源服务器；
	 * 当源服务器返回的响应中Cache-Control属性中指定了max-age，缓存服务器将不对资源的有效性再做确认。
	 */

	//console.log(request);
	let ifModifiedSince = request['headers']['if-modified-since'];
	let ifNoneMatch = request['headers']['if-none-match'];
	//let maxAge = request['rawHeaders'][5];
	
	if(ifNoneMatch){
		if(ifNoneMatch===etag){
			response.writeHead(304, {'Content-Type': 'text/plain'});
		}else{
			response.writeHead(200, {'Content-Type': 'text/plain'});
			response.write('Hello World'+new Date());
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
			response.writeHead(304, {'Content-Type': 'text/plain'});
		}else{
			response.writeHead(200, {'Content-Type': 'text/plain'});
			response.write('Hello World'+new Date());
		}
	}else{
		response.writeHead(200, {'Content-Type': 'text/plain'});
		response.write('Hello World'+new Date());
	}
	
	response.end();

}).listen(8888);
