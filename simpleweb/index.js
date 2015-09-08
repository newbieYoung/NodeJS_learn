/**
 * 简单服务器入口
 */
var server = require('./server');
var router = require('./router');
var requestHandler = require('./requestHandler');

var handler = {};
handler['/'] = requestHandler.root;
handler['/start'] = requestHandler.start;
handler['/error'] = requestHandler.error;
handler['/upload'] = requestHandler.upload;

server.start(router.route,handler);