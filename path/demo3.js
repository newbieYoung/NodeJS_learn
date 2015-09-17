/**
 * 读取文件内容并去掉BOM字符，然后转码成gbk输出
 */
var iconv = require('iconv-lite');
var fs = require('fs');

function readGBKText(path){
	var bin = fs.readFileSync(path);
	if(bin[0] === 0xEF && bin[1] === 0xBB && bin[2] === 0xBF){
		bin = bin.slice(3);
	}
	console.log(iconv.decode(bin, 'gbk'));
}

var argv = process.argv.slice(2);
readGBKText(argv[0]);