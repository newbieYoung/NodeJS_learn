/**
 * 测试querystring模块中的一些方法
 */
var querystring = require('querystring');

var queryStr = 'foo=bar&baz=qux&baz=quux&corge';

console.log(querystring.parse(queryStr));

var queryObj = { foo: 'bar', baz: ['qux', 'quux'], corge: '' };

console.log(querystring.stringify(queryObj));

