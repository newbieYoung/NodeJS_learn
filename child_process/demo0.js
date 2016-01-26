/**
 * 测试child_process模块
 */
'use strict';
let child_process = require('child_process');

//获取nodejs_learn项目路径
let endIndex = __dirname.lastIndexOf('/');
let root = __dirname.substr(0,endIndex);

child_process.exec('mkdir '+root+'/temp',function(){
	console.log('mkdir temp success');
});