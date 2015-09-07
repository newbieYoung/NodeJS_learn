/**
 * 服务
 */
var http = require('http');

function start(route,handler){
	http.createServer(function(req,res){
		var url = req.url;
		console.log(url+' request received.');
		res.writeHead(200,{'Content-Type':'text/plain'})
		var routeResult = route(handler,url);
		if(routeResult.flag){
			res.write('hello world '+routeResult.msg);
		}else{
			res.write(routeResult.msg);
		}
		res.end();
	}).listen(9999);

	console.log('server has started at 9999');
}

exports.start = start;