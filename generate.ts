import { Directory, File,Logger } from "./lib/index.js";
import * as child_process from "child_process";
File.initDir("out")
File.initDir("out/libs")
File.copy("lib","out/lib");
File.copy("src","out/src");
File.copy("build.ts","out/build.ts");
//编译构建脚本
/*
结构：有一个build文件夹，是一个npm包，构建时通过node build来构建
但是构建是现场构建，在out里放好out和build.ts后，直接在out文件夹里开始编译
先创建tsconfig.json，然后直接开始编译
编译结束后，写入package.json
最后删除build.ts
*/
File.forceWrite("out/tsconfig.json",JSON.stringify({
    files: ["build.ts"],
    exclude: ["./v0/**", "./build/**"],
    lib: [ "dom", "es5", "es2015.promise" ,"es2015", "es2017"],
    compilerOptions: {
        outDir: "./build",
        downlevelIteration: true,
        rootDir: "."
    }   
}))
//切换工作目录到输出文件夹中
let current_directory=new Directory(process.cwd())
current_directory.folders.push("out");
process.chdir(current_directory.toString(false))
//开始编译
Logger.info(child_process.spawnSync("tsc").stdout.toString());
//切换回原目录
current_directory=new Directory(process.cwd())
current_directory.folders.pop();
process.chdir(current_directory.toString(false))

File.forceWrite("out/build/package.json",JSON.stringify({
    name:"Full Moon Platform builder",
    main:"build.js"
}))
File.delete("out/build.ts");
File.delete("out/tsconfig.json")

//build创建成之后，写入给插件开发用的tsconfig.json