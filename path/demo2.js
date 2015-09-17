/**
 * 读取文件内容并去掉BOM字符，然后转码成utf-8输出
 */
var fs = require('fs');

function readText(path){
	var bin = fs.readFileSync(path);
	if(bin[0] === 0xEF && bin[1] === 0xBB && bin[2] === 0xBF){
		bin = bin.slice(3);
	}
	console.log(bin.toString('utf-8'));
}

var argv = process.argv.slice(2);
readText(argv[0]);