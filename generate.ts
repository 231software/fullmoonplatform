import { FMPDirectory, FMPFile } from "./lib/File.js";
import {FMPLogger} from "./lib/Logger.js"
import * as child_process from "child_process";

(async ()=>{
await FMPFile.initDir("out")
await FMPFile.initDir("out/libs")
await FMPFile.copy("lib","out/lib",{replaceFolder:true});
await FMPFile.copy("src","out/src",{replaceFolder:true});
await FMPFile.copy("build.ts","out/build.ts",{replaceFiles:true});
//编译构建脚本
/*
结构：有一个build文件夹，是一个npm包，构建时通过node build来构建
但是构建是现场构建，在out里放好out和build.ts后，直接在out文件夹里开始编译
先创建tsconfig.json，然后直接开始编译
编译结束后，写入package.json
最后删除build.ts
*/
//区分一下，根目录的是给generate用的tsconfig，out里的tsconfig是给生成build用的
await FMPFile.forceWrite("out/tsconfig.json",JSON.stringify({
    FMPFiles: ["build.ts"],
    exclude: ["./v0/**", "./build/**"],
    //es2018是为了正则表达式
    lib: [ "dom", "es5", "es2015.promise" ,"es2015", "es2017","es2018"],
    compilerOptions: {
        outDir: "./build",
        rootDir: ".",
        target:"es2018",
        moduleResolution:"nodenext",
        module:"NodeNext",
        types:["node"]
    }
}))
//切换工作目录到输出文件夹中
let current_directory=new FMPDirectory(process.cwd())
current_directory.folders.push("out");
process.chdir(current_directory.toString(false))
//开始编译构建脚本
FMPLogger.info("开始编译构建脚本")
const tsc_result=child_process.spawnSync("tsc",[],{shell: true})
if(tsc_result.stdout){
    for(let line of tsc_result.stdout.toString().split("\n"))FMPLogger.info(line);
}
else {
    if(tsc_result.stderr){
        FMPLogger.error("编译构建脚本时有以下报错")
        for(let line of tsc_result.stderr.toString().split("\n"))FMPLogger.error(line)
    }
    else{
        FMPLogger.error("tsc命令执行失败，无法捕获任何编译输出。")
        FMPLogger.error("退出代码：",tsc_result.status)
    }
}
//切换回原目录
current_directory=new FMPDirectory(process.cwd())
current_directory.folders.pop();
process.chdir(current_directory.toString(false))
//为可执行npm包build文件夹创建package.json
await FMPFile.forceWrite("out/build/package.json",JSON.stringify({
    name:"Full Moon Platform builder",
    main:"build.js"
}))
//复制示例plugin.json
await FMPFile.copy("plugin.json","out/plugin.json",{replaceFiles:true})
await FMPFile.permanentlyDelete("out/build.ts");
await FMPFile.permanentlyDelete("out/tsconfig.json")

//build创建成之后，写入给插件开发用的tsconfig.json

FMPLogger.info("编译脚本构建结束")

})()