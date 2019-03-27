/**
 * 奇数尺寸图片，增加1px透明区域变为偶数尺寸
 * 用于rem单位背景，图片周围再额外增加2px间隙
 */

'use strict';
let path = require('path');
let fs = require('fs');
let Sharp = require('sharp');

let inputDir = '/Users/newyoung/vipstyle/2019/variety-shop/img/slice/rem';
let outPutDir = '/Users/newyoung/vipstyle/2019/variety-shop/img/slice/rem/output';

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

function oddToEven(pathName,fileName){//处理图片
    Sharp(pathName)
        .metadata()
        .then(info => {
            var size = {
                width:info.width,
                height:info.height
            };

            if(fileName.indexOf('@2x')==-1){
                //用于rem单位背景，额外新增2px间隙
                size.width += 4;
                size.height += 4;

                var extname = path.extname(fileName);
                var no = fileName.lastIndexOf(extname);
                fileName = fileName.substring(0,no)+'@2x'+extname;

                //处理奇数尺寸
                size.width = size.width%2==0?size.width:size.width+1;
                size.height = size.height%2==0?size.height:size.height+1;

                //生成偶数透明背景
                var emptyImage = Sharp({
                    create: {
                        width: size.width,
                        height: size.height,
                        channels: 4,
                        background: { r: 255, g: 255, b: 255 , alpha: 0 }
                    }
                }).png();

                emptyImage.overlayWith(pathName, { gravity: Sharp.gravity.centre } )
                    .toFile(outPutDir+'/'+fileName, function(err) {
                        if(err){
                            console.log(err);
                        }else{
                            console.log('success');
                        }
                    });
            }

            
        })
        .catch(err => {
            if(err){
                console.log(err)
            }
        })
}

dirSync(inputDir,oddToEven);


