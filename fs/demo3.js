/**
 * 逐行文件读取
 * 处理内容是用空格、tab、换行符号处理的简单表格式文本文件，并导出js文件形式的json数据
 * node demo3.js china_code.txt demo3-data.js
 */
var fs = require('fs');
var readline = require('readline');

//逻辑入口
function main(argv) {
    //属性名称数组
    var propertyArr = ['code','county','city','province','parentCode','historyCode','longitude','latitude','telCode','postCode','area','populationSize','govWebSite','govWebAddress'];
    //输入流
    var rs = fs.createReadStream(argv[0]);
    //输出流
    var ws = fs.createWriteStream(argv[1]);
    //逐行读取
    var rl = readline.createInterface({
        input: rs,
        output: ws
    });
    var total = [];
    var totalJson = [];
    var lineNum = 1;
    rl.on('line', function(line) {
        //从第二行开始读取
        if(lineNum>=2){
            if(line==='-----end-----'){//结束行
                //整理数据的父子关系
                rl.output.write(treeRelationship(total,totalJson));
            }else{
                //内容中的多个空格相连替换成一个空格
                line = line.replace(/(\x20{2,})/g,' ');
                var arr = line.split(' ');
                var obj = {};
                for(var i=0;i<arr.length;i++){
                    obj[propertyArr[i]] = arr[i];
                }
                obj['childs'] = [];
                total.push(obj);
            }
        }
        lineNum++;
    });
}

//树结构算法
function treeRelationship(total,totalJson){
    for(var i=0;i<total.length;i++){
        totalJson.push(JSON.stringify(total[i]));
    }
    //用于保存级别(0、1、2...)
    var limitArr = [];
    for(var i=0;i<total.length;i++){
        var item = total[i];
        if(item.parentCode!=null){
            var iParentCode = item.parentCode;
            var j = 0;
            var limit = 0;
            while(j<total.length){
                if(total[j].code!==iParentCode){
                    j++
                }else{
                    limit++;
                    if(total[j].code!==iParentCode){
                        iParentCode = total[j].code;
                        j = 0;
                    }else{
                        break;
                    }
                }
            }
            limitArr.push(limit);
        }else{
            limitArr.push(0);
        }
    }
    //找到等级的最大值（等级值越大意味着在树的结构中越在里边）
    var maxLimit = 0;
    for(i=0;i<limitArr.length;i++){
        item = limitArr[i];
        if(item>maxLimit){
            maxLimit = item;
        }
    }
    //开始组织树结构
    for(var startLimit = maxLimit;startLimit>=0;startLimit--){
        for(i=0;i<totalJson.length;i++){
            if(limitArr[i]===startLimit&&total[i].parentCode!=null){
                //找到自己的父节点
                for(j=0;j<total.length;j++){
                    if(total[j].code===total[i].parentCode){
                        //找到[
                        item = totalJson[j];
                        var index = item.indexOf('[');
                        var strFather = item.substring(0,index+1)+','+totalJson[i]+item.substring(index+1,item.length);
                        totalJson[j] = strFather;
                    }
                }
            }
        }
    }
    //找出级别最小的节点
    var fatherArr = [];
    for(i=0;i<totalJson.length;i++){
        if(limitArr[i]===0){
            fatherArr.push(totalJson[i]);
        }
    }
    //组成最终的树节点
    var result = '';
    result += '[';
    for(i=0;i<fatherArr.length;i++){
        result += fatherArr[i];
        if(i!==fatherArr.length-1){
            result += ',';
        }
    }
    result += ']';
    //由于拼接时可能导致"[,"这种情况，所以需要替换为"["
    result = result.replace(/\[,/g,'[');
    return result;
}

var argv = process.argv.slice(2);
console.log(argv);
main(argv);
