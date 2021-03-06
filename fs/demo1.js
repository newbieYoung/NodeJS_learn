/**
 * 采用一次性读取某个文件的全部内容，然后复制到另外一个文件
 * babel-node demo1.js demo0.txt demo1.txt
 */
'use strict';
let fs = require('fs');

function copy(src,dst){
	fs.writeFileSync(dst,fs.readFileSync(src));
}

function main(argv){
	copy(argv[0],argv[1]);
}

console.log(process.argv);
let argv = process.argv.slice(2);
console.log(argv);
main(argv);