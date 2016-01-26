/**
 * 创建一个文件，并写入一些内容
 * babel-node demo0.js
 */
'use strict';
let fs = require('fs');
fs.writeFile('demo0.txt','i created a new file using writeFile function!',function(err){
	if (err) throw err;
	console.log('Saved successfully'); //文件被保存
});