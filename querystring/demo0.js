/**
 * 测试querystring模块中的一些方法
 */
'use strict';
let querystring = require('querystring');

let queryStr = 'foo=bar&baz=qux&baz=quux&corge';

console.log(querystring.parse(queryStr));

let queryObj = { foo: 'bar', baz: ['qux', 'quux'], corge: '' };

console.log(querystring.stringify(queryObj));

