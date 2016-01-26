/**
 * 测试url模块中的一些方法
 */
'use strict';
let url = require('url');

let href = 'http://user:pass@host.com:8080/p/a/t/h?query=string#hash';

console.log(href);

console.log(url.parse(href));

console.log(url.format({
	protocol: 'http:',
    host: 'www.example.com',
    pathname: '/p/a/t/h',
    search: 'query=string'
}));

console.log(url.resolve('http://www.example.com/foo/bar', '../baz'));
