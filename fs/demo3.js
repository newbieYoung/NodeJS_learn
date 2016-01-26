/**
 * 逐行文件读取
 * 处理内容是用空格、tab、换行符号处理的简单表格式文本文件，并导出js文件形式的json数据
 * babel-node demo3.js china-code.txt demo3-data.js
 */
'use strict';
let fs = require('fs');
let readline = require('readline');

//逻辑入口
function main(argv) {
    //属性名称数组
    let propertyArr = ['code','county','city','province','parentCode','historyCode','longitude','latitude','telCode','postCode','area','populationSize','govWebSite','govWebAddress'];
    //输入流
    let rs = fs.createReadStream(argv[0]);
    //输出流
    let ws = fs.createWriteStream(argv[1]);
    //逐行读取
    let rl = readline.createInterface({
        input: rs,
        output: ws
    });
    let total = [];
    let totalJson = [];
    let lineNum = 1;
    rl.on('line', function(line) {
        //从第二行开始读取
        if(lineNum>=2){
            if(line==='-----end-----'){//结束行
                //整理数据的父子关系
                rl.output.write(treeRelationship(total,totalJson));
            }else{
                //内容中的多个空格相连替换成一个空格
                line = line.replace(/(\x20{2,})/g,' ');
                let arr = line.split(' ');
                let obj = {};
                for(let i=0;i<arr.length;i++){
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
    for(let i=0;i<total.length;i++){
        totalJson.push(JSON.stringify(total[i]));
    }
    //用于保存级别(0、1、2...)
    let limitArr = [];
    for(let i=0;i<total.length;i++){
        let item = total[i];
        if(item.parentCode!=null){
            let iParentCode = item.parentCode;
            let j = 0;
            let limit = 0;
            while(j<total.length){
                let itemJ = total[j];
                if(itemJ.code!==iParentCode){
                    j++
                }else{
                    limit++;
                    if(itemJ.parentCode!=null){
                        iParentCode = itemJ.parentCode;
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
    let maxLimit = 0;
    for(let i=0;i<limitArr.length;i++){
        let item = limitArr[i];
        if(item>maxLimit){
            maxLimit = item;
        }
    }
    //开始组织树结构
    for(let startLimit = maxLimit;startLimit>=0;startLimit--){
        for(let i=0;i<totalJson.length;i++){
            if(limitArr[i]===startLimit&&total[i].parentCode!=null){
                //找到自己的父节点
                for(let j=0;j<total.length;j++){
                    if(total[j].code===total[i].parentCode){
                        //找到[
                        let item = totalJson[j];
                        let index = item.indexOf('[');
                        let strFather = item.substring(0,index+1)+','+totalJson[i]+item.substring(index+1,item.length);
                        totalJson[j] = strFather;
                    }
                }
            }
        }
    }
    //找出级别最小的节点
    let fatherArr = [];
    for(let i=0;i<totalJson.length;i++){
        if(limitArr[i]===0){
            fatherArr.push(totalJson[i]);
        }
    }
    //组成最终的树节点
    let result = '';
    result += '[';
    for(let i=0;i<fatherArr.length;i++){
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

let argv = process.argv.slice(2);
console.log(argv);
main(argv);
