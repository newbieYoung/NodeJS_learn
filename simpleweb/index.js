/**
 * 简单服务器入口
 */
'use strict';
let server = require('./server');
let router = require('./router');
let requestHandler = require('./requestHandler');

let handler = {};
handler['/'] = requestHandler.root;
handler['/start'] = requestHandler.start;
handler['/error'] = requestHandler.error;
handler['/upload'] = requestHandler.upload;

server.start(router.route,handler);