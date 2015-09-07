/**
 * 简单服务器入口
 */
var server = require('./server');
var router = require('./router');
var requestHandler = require('./requestHandler');

var handler = {};
handler['/'] = requestHandler.root;

server.start(router.route,handler);