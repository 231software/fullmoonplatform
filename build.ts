/*
插件有一个没有实现的模板库，平时写插件的时候引用的是这个模板库  
这个库里没有实现，只有空的各种类，函数和方法  
lib就是这个模板库  
 */
/**
 * 满月平台格式规范
 * 所有库都要放在libs里面
 * 库整体以一个文件夹存在，文件夹格式如下：
 * - 根目录
 *     - libs（用于直接放到根目录供插件引用的文件夹，包括各平台的库）
 *     - fmplib.json（库属性）
 * 其中，fmplib.json的格式如下：
 * {
 *     name:库名
 *     author:作者
 *     repositoy:仓库地址
 *     maximum_version:各平台要求的引擎最低版本
 * }
 */
/**
 * 创建输出文件夹
 * 通过plugin.json生成tsconfig.json
 * 之后开始构建，先把lib中的内容放入temp
 * 然后，在libs中扫描所有符合满月平台库格式的文件夹，先统计所有库的名称
 * 之后，根据priorities配置项依次执行以下操作：
 * 遍历所有平台
 * 直接（暂时先这么做）将default指定的库的libs中的当前平台的实现中的lib文件夹复制到根目录供插件源码引用
 * 如果没有default项，会提示“插件没有配置默认库，所有未指定默认库的库文件都将不会为编译提供。”
 * 编译插件
 * 删除lib文件夹
 * 最后把temp中的lib文件夹放回原位
 */
import {FMPDirectory, FMPFile, FMPLogger} from "./lib/index.js"
import * as child_process from "child_process";
const platforms_featuers=new Map([
    [
        "nodejs",{
            isNodeJS:true,
            lib:"nolib"
        },
    ],
    [
        "llse",{
            isNodeJS:true,
            unsupported_packages:[
                "sqlite3",
                "better-sqlite3"
            ],
            lib:"nolib"
        }        
    ],
    [
        "llselib",{
            isNodeJS:false,
            lib:"llselib"
        }        
    ],
    [
        "lse",{
            isNodeJS:false,
            unsupported_packages:[
                "sqlite3",
                "better-sqlite3"
            ],
            lib:"nolib"
        }        
    ],
    [
        "ls",{
            isNodeJS:true,
            unsupported_packages:[
                "sqlite3",
                "better-sqlite3"
            ],
            lib:"nolib"
        }        
    ],
    [
        "bdsx",{
            isNodeJS:true,
            unsupported_packages:[
                "sqlite3"
            ],
            lib:"bdsx"
        }        
    ]
])
FMPLogger.info("开始构建")
//读取plugin.json
const plugin_conf=JSON.parse(FMPFile.read("plugin.json"));
//根据plugin.json创建输出文件夹
FMPFile.initDir(plugin_conf.build_dir);
//为各平台整理库
//创建temp文件夹并将原开发辅助lib放入temp
FMPFile.initDir("temp");
FMPFile.rename("lib","temp/lib");
//在temp中创建libs文件夹，放置整理好用于编译的文件夹
FMPFile.initDir("temp/libs")
//（临时方案）直接把plugin.json中priorities项default指定的库中的支持平台定为插件支持的平台
//后面这里需要把所有库里的所有平台整理出来成为一个总的列表，还要用plugin.json里面提供的支持平台过滤，下面这个switch是实现
switch(plugin_conf.supported_platforms.mode){
    case "bl":
        for(let platform of plugin_conf.supported_platforms.list){
            //此处为黑名单模式下，遇到不支持平台时的处理方法的实现
        }
        break;
}
//
let supported_platforms:string[]=[];
if(!plugin_conf.priorities.default){
    FMPLogger.info("插件没有配置默认库，所有未指定默认库的库文件都将不会用于编译。");
}
else{
    for(let platform of FMPFile.ls("libs/"+plugin_conf.priorities.default[0]+"/libs")){
        supported_platforms=supported_platforms.concat(platform);
        //（临时方案）按照支持平台整理库文件时，按plugin.json中priorities项default指定的库直接复制
        FMPFile.copy("libs/"+plugin_conf.priorities.default[0]+"/libs","temp/libs");
    }
}
//整理完成，遍历所有平台开始编译
for(let platform of supported_platforms){
    //跳过各操作系统为目录生成的文件
    if(platform==".DS_Store")continue;
    const platform_features=platforms_featuers.get(platform);
    FMPLogger.info(platform)
    FMPFile.copy("temp/libs/"+platform+"/lib","lib");
    //写入tsconfig.json
    const tsconfig:any={
        //忽略libs
        exclude: ["./v0/**", "./dist/**","libs","build","temp"],
        files:["index.ts"],
        compilerOptions: {
            outDir: plugin_conf.build_dir+"/"+platform+"/"+plugin_conf.plugin_dir_name,
            rootDir: ".",
            resolveJsonModule: true,
            downlevelIteration: true,
            target: "ES2016",
            moduleResolution: "node" ,
            // https://www.jianshu.com/p/359c71344084
            forceConsistentCasingInFileNames:false
        }
    }
    FMPFile.forceWrite("tsconfig.json",JSON.stringify(tsconfig));
    //写入index.ts
    FMPFile.forceWrite("index.ts",`
    import "./${plugin_conf.src_dir}/${plugin_conf.main}.js";
    import {ScriptDone} from "./lib/index.js";
    ${platform=="NodeJS"?"ScriptDone()":""};
    export function main(){
        ScriptDone();
    }
    `)
    //执行编译命令
    const task=child_process.spawnSync("tsc")
    FMPLogger.info(task.stdout.toString())
    if(task.stderr){
        FMPLogger.info(task.stderr.toString())
    }
    //如果当前平台有package.json，就根据plugin.json创建package.json
    if(platform_features?.isNodeJS){
        const npm_package:any={
            name:plugin_conf.name,
            main:"index.js",
            description:plugin_conf.description,
            type:"module"
        };
        //处理各平台无法运行的包
        if(plugin_conf.dependencies){
            const dependencies=plugin_conf.dependencies;
            if(platform_features.unsupported_packages){
                for(let unsupported_package of platform_features.unsupported_packages){
                    delete dependencies[unsupported_package];
                }
            }
            //如果该平台不支持任何提供的包，直接不添加dependencies项以防出错
            if(Object.keys(dependencies).length!=0){
                npm_package.dependencies=dependencies;
            }
        }
        //最后写入这个package.json
        FMPFile.forceWrite(plugin_conf.build_dir+"/"+platform+"/"+plugin_conf.plugin_dir_name+"/package.json",JSON.stringify(npm_package,undefined,4))
    }

    //删除tsconfig.json
    FMPFile.permanently_delete("tsconfig.json");
    //最后将这个复制过来的lib删除
    FMPFile.permanently_delete("lib")
}

//将lib放回原位
FMPFile.rename("temp/lib","lib");
//删除temp
FMPFile.permanently_delete("temp")
FMPLogger.info("构建完成")