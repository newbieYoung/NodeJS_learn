/**
 * 读取文件内容并去掉BOM字符，然后转码成gbk输出
 */
'use strict';
let iconv = require('iconv-lite');
let fs = require('fs');

function readGBKText(path){
	let bin = fs.readFileSync(path);
	if(bin[0] === 0xEF && bin[1] === 0xBB && bin[2] === 0xBF){
		bin = bin.slice(3);
	}
	console.log(iconv.decode(bin, 'gbk'));
}

let argv = process.argv.slice(2);
readGBKText(argv[0]);