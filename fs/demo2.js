/**
 * 通过连接输入流和输出流的方式复制文件
 * node demo2.js demo0.txt demo2.txt
 */
var fs = require('fs');

function copy(src,dst){
	fs.createReadStream(src).pipe(fs.createWriteStream(dst));
}

function main(argv){
	copy(argv[0],argv[1]);
}

console.log(process.argv);
var argv = process.argv.slice(2);
console.log(argv);
main(argv);