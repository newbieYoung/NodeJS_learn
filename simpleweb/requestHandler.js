/**
 * 逻辑处理
 */
function root(res,data){
	res.writeHead(200, {"Content-Type": "text/html"});
    res.write('hello simpleweb');
    res.end();
}
function upload(res,data){
	res.writeHead(200, {"Content-Type": "text/html"});
    res.write('you have send:'+data.postData);
    res.end();
}
function start(res,data){
	var body = '<html>'+
    '<head>'+
    '<meta http-equiv="Content-Type" content="text/html; '+
    'charset=UTF-8" />'+
    '</head>'+
    '<body>'+
    '<form action="/upload" method="post">'+
    '<textarea name="text" rows="20" cols="60"></textarea>'+
    '<input type="submit" value="Submit text" />'+
    '</form>'+
    '</body>'+
    '</html>';
	res.writeHead(200, {"Content-Type": "text/html"});
    res.write(body);
    res.end();
}
function error(res,data){
	res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write(data.url+' 404 Not found');
    res.end();
}

exports.root = root;
exports.start = start;
exports.upload = upload;
exports.error = error;