/**
 * 同步遍历某个文件夹里边的所有文件
 */
'use strict';
let path = require('path');
let fs = require('fs');

function dirSync(dir,callback){
	fs.readdirSync(dir).forEach(function(file){
		let pathName = path.join(dir,file);
		//如果当前文件是目录则继续遍历
		if(fs.statSync(pathName).isDirectory()){
			dirSync(pathName,callback);
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

let dir = process.argv.slice(2);
if(!dir||dir.length<=0){
	//获取nodejs_learn项目路径
	let endIndex = __dirname.lastIndexOf('/');
	dir.push(__dirname.substr(0,endIndex));
}
console.log(dir);
ls(dir[0]);