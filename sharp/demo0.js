/**
 * 处理奇数尺寸图片，新增1px透明背景，让其宽高均为偶数
 */
var Sharp = require('sharp');

var inputPath = './input/test-0.png';
var outputPath = './output/test-0.png';

Sharp(inputPath)//输入图片路径
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
        })
            .png();

        emptyImage.overlayWith(inputPath, { gravity: Sharp.gravity.southeast } )
            //.toBuffer()//输出buffer形式
            .toFile(outputPath, function(err) {//直接输出图片
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

