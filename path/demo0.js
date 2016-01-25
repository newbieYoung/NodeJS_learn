/**
 * 测试path模块
 */
var path = require('path');

console.log(path.normalize('/first/second/../'));

console.log(path.join('/first','/second','/third','../'));

console.log(path.extname('/first/second/demo0.js'));