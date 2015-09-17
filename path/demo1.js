/**
 * 同步遍历某个文件夹里边的所有文件
 */
var path = require('path');
var fs = require('fs');

function dirSync(dir,callback){
	fs.readdirSync(dir).forEach(function(file){
		var pathName = path.join(dir,file);
		//如果当前文件是目录则继续遍历
		if(fs.statSync(pathName).isDirectory()){
			setTimeout(function(){
				dirSync(pathName,callback);
			},0);
		}else{
			callback(pathName);
		}
	});
}

function ls(dir){
	dirSync(dir,function(name){
		console.log(name);
	});
}

var dir = process.argv.slice(2);
console.log(dir);
ls(dir[0])