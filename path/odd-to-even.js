/**
 * 奇数尺寸图片，增加1px透明区域变为偶数尺寸
 */

'use strict';
let path = require('path');
let fs = require('fs');
let Sharp = require('sharp');

let inputDir = '/Users/newyoung/qz-act/2018/vip-sales-system/img/slice/rem';
let outPutDir = '/Users/newyoung/qz-act/2018/vip-sales-system/img/slice/rem/output';

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

            //判断尺寸
            size.width = size.width%2==0?size.width:size.width+1;
            size.height = size.height%2==0?size.height:size.height+1;

            if(size.width==info.width&&size.height==info.height){
                //宽高均为偶数，不作处理
            }else{
                //生成偶数透明背景
                var emptyImage = Sharp({
                    create: {
                        width: size.width,
                        height: size.height,
                        channels: 4,
                        background: { r: 255, g: 255, b: 255 , alpha: 0 }
                    }
                }).png();

                emptyImage.overlayWith(pathName, { gravity: Sharp.gravity.southeast } )
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


