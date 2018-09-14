/**
 * 小图片批量转换为base64格式，并生成对应css文件
 */

'use strict';
let path = require('path');
let fs = require('fs');
let base64Img = require('base64-img');

let inputDir = '/Users/newyoung/qz-act/2018/vip-sales-system/img/number';
let outPutDir = '/Users/newyoung/qz-act/2018/vip-sales-system/img/number/output';

function dirSync(dir,callback){//遍历目录
    fs.readdirSync(dir).forEach(function(file){
        let pathName = path.join(dir,file);
        //如果当前文件是目录则继续遍历
        if(fs.statSync(pathName).isDirectory()){
            dirSync(pathName,callback);
        }else{
            if(isImage(file)){
                callback(pathName,file);
            }
        }
    });
}

function isImage(fileName){
    var extname = path.extname(fileName).toLowerCase();
    if(extname=='.png'||extname=='.jpg'||extname=='.jpeg'){
        return true;
    }else{
        return false;
    }
}

function imageToBase64(pathName,fileName){
    var data = base64Img.base64Sync(pathName);
    var name = fileName.substring(0,fileName.lastIndexOf('.'));
    var code = '.'+name+'{\n';
        code += 'background-image:url('+data+')\n';
        code += '}\n';
    fs.appendFile(outPutDir+'/image.css', code, function (err) {
        if (err) throw err;
        console.log(fileName + ' success');
    });
}

dirSync(inputDir,imageToBase64);