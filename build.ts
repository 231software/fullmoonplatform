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
import {Directory, File, JsonFile, Logger} from "./lib/index.js"
import * as child_process from "child_process";
/** 各平台的**特性**配置文件，将来需要独立出去，因为需要供其他开发者修改 */

/*
const platforms_featuers=new Map([
    [
        "llselib",{
            isNodeJS:false,
            lib:"llselib"
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
            lib:"bdsx",
            features:{
                yml:["yaml","^2.5.1"],
                xml:["xml","^1.0.1"],
                ws:["ws","8.18.0"],
                sqlite3:["better-sqlite3","^11.3.0"]
            }
        }        
    ]
])
*/

Logger.info("开始构建")
//读取plugin.json
/**插件的配置文件，来自`plugin.json` */
const plugin_conf=JSON.parse(File.read("plugin.json"));

//根据plugin.json创建输出文件夹
File.initDir(plugin_conf.build_dir);

//为各平台整理库
//创建temp文件夹并将原开发辅助lib放入temp
File.initDir("temp");
try{
    File.rename("lib","temp/lib");
}
catch(e){
    Logger.warn("找不到原开发辅助文件夹lib！\n错误原因：\n"+e)
}

//在temp中创建libs文件夹，放置整理好用于编译的文件夹
File.initDir("temp/libs")

//（临时方案）直接把plugin.json中priorities项default指定的库中的支持平台定为插件支持的平台
//后面这里需要把所有库里的所有平台整理出来成为一个总的列表，还要用plugin.json里面提供的支持平台过滤，下面这个switch是实现
switch(plugin_conf.supported_platforms.mode){
    case "bl":
        for(let platform of plugin_conf.supported_platforms.list){
            //此处为黑名单模式下，遇到不支持平台时的处理方法的实现
        }
        break;
}

/**本地编译中所有将会得到支持的平台 */
const supported_platforms:string[]=[];
if(!plugin_conf.priorities.default){
    Logger.info("插件没有配置默认库，所有未指定默认库的库文件都将不会用于编译。");
    Logger.info("如果这是您刚刚配置完成的满月平台项目，请在plugin.json的priorities中新建default项，并配置一些项目默认使用用来编译的库");
}
else{
    //尝试读取库中所有的文件夹，每个文件夹是一个平台
    //临时方案，只读取第一个
    /**将库中每个文件夹都当作一个平台来整理出的所有当前库支持的平台的列表 */
    const platforms=(()=>{
        try{
            return File.ls("libs/"+plugin_conf.priorities.default[0]+"/libs");
        }
        catch(e){
            Logger.error("无法获取库"+plugin_conf.priorities.default[0]+"中支持平台列表\n错误原因：\n"+e)
            return []
        }
    })()
    for(let platform of platforms){
        supported_platforms.push(platform);
        //（临时方案）按照支持平台整理库文件时，按plugin.json中priorities项default指定的库直接复制
        //temp里面的libs是最终要用的libs文件夹，里面一个文件夹对应一个平台的库
        //将用于编译的libs文件夹的库复制到temp里，组装成最终要用的libs文件夹
        File.copy("libs/"+plugin_conf.priorities.default[0]+"/libs","temp/libs");
    }
}

//整理完成，遍历所有平台开始编译
for(let platform of supported_platforms){
    compile_specified_platform(platform)
}

//将lib放回原位
File.rename("temp/lib","lib");

//删除temp
File.permanently_delete("temp")
Logger.info("构建完成")

/**
 * 为指定平台执行一次编译
 * @param platform 当前平台的名字
 * @returns 
 */
function compile_specified_platform(platform:string){
    //跳过各操作系统为目录生成的文件
    if([".DS_Store",".desktop.ini","Thumb.db"].includes(platform))return;

    Logger.info("正在为"+platform+"平台构建")

    //读取当前平台的特性配置文件
    if(!File.ls(`temp/libs/${platform}`).includes("platform.json")){
        Logger.error(platform+"不包含platform.json，不会为此平台编译。")
        return
    }
    /**当前平台的特性配置文件 */
    const platform_features=new JsonFile(`temp/libs/${platform}/platform.json`).rootobj;

    //将当前平台的lib文件夹复制到根目录用于编译
    File.copy("temp/libs/"+platform+"/lib","lib");
    

    //写入tsconfig.json
    write_tsconfig(platform,platform_features)

    //写入index.ts
    //这些平台的开服事件并不位于事件系统，需要ScriptDone()触发
    File.forceWrite("index.ts",`
    import "./${plugin_conf.src_dir}/${plugin_conf.main}.js";
    import {ScriptDone} from "./lib/index.js";
    ${platform_features.require_ScriptDone===true?"ScriptDone();":""}
    export function main(){
        ScriptDone();
    }
    `)

    //写入plugin_info.ts
    write_plugin_info(platform,platform_features.data_path)

    //编写FeaturesIndex.ts
    writeFeaturesIndex()

    //使用nodejs运行库为当前平台指定的编译前运行javascript脚本，该脚本位于每个平台的libs文件夹同级目录
    run_lib_scripts(platform,"before_compile.js")

    //执行编译命令
    const task=child_process.spawnSync("tsc",[],{shell:true})
    Logger.info(task.stdout.toString())
    if(task.stderr){
        Logger.info(task.stderr.toString())
    }

    //写入package.json
    write_package_json(platform,platform_features)

    //使用nodejs运行库为当前平台指定的编译后运行javascript脚本，该脚本位于每个平台的libs文件夹同级目录
    run_lib_scripts(platform,"after_compile.js")
    
    //删除index.ts
    File.permanently_delete("index.ts");
    
    //删除tsconfig.json
    File.permanently_delete("tsconfig.json");

    //最后将这个复制过来的lib删除
    File.permanently_delete("lib")
}

/**
 * 为插件写入plugin_info常量供代码读取
 * @param platform 平台名
 */
function write_plugin_info(platform:string,plugin_data_path:string){
    //<data_path>是占位符，表示插件定义的data_path，必须位于末尾，未填则会导致插件执行时无视其配置的data_path而完全只采用库定义的路径
    //<data_path>前必须带“/”，后面不能再出现任何字符
    let data_path=plugin_data_path.replace("<data_path>",plugin_conf.data_path)
    File.forceWrite("lib/plugin_info.ts",`
export const INFO=JSON.parse(\`${JSON.stringify(plugin_conf)}\`)
export const data_path="${data_path}"
export const PLATFORM="${platform}"
    `);
}

function write_tsconfig(platform:string,platform_features:any){
    const tsconfig:any={
        //忽略libs
        exclude: ["./v0/**", "./dist/**","libs","build","temp"],
        files:["index.ts"],
        compilerOptions: {
            outDir: plugin_conf.build_dir+"/"+platform+"/"+plugin_conf.plugin_dir_name,
            rootDir: ".",
            resolveJsonModule: true,
            downlevelIteration: true,
            target: platform_features?.tstarget,
            moduleResolution: "node",
            // https://www.jianshu.com/p/359c71344084
            forceConsistentCasingInFileNames:false
        }
    }
    File.forceWrite("tsconfig.json",JSON.stringify(tsconfig));
}

/**写入package.json */
function write_package_json(platform:string,platform_features:any){
    //如果当前平台有package.json，就根据plugin.json创建package.json
    if(!platform_features?.isNodeJS)return;
    /**package.json的基础的内容 */
    const npm_package:any={
        name:plugin_conf.name,
        main:"index.js",
        description:plugin_conf.description
    };
    //处理要写入package.json中dependencies的npm包，即plugin.json的dependencies项
    if(plugin_conf.dependencies){
        const dependencies=plugin_conf.dependencies;
        if(platform_features.unsupported_packages){
            //删除所有已经写入plugin.json，但却已被指明当前平台不受支持的包
            for(let unsupported_package of platform_features.unsupported_packages){
                delete dependencies[unsupported_package];
            }
        }
        //将刚刚整理完的依赖的键写入整个package.json的对象中
        //如果该平台不支持任何提供的包，直接不添加dependencies项以防出错
        if(Object.keys(dependencies).length!=0){
            npm_package.dependencies=dependencies;
        }
    }

    //处理features，如果features中包含需要在nodejs中额外安装的包，就写入package.json
    if(plugin_conf.features){
        const features:string[]=plugin_conf.features
        const packages:[string,string][]=[]

        //根据feature的内容，在特性配置中找到对应的npm包并加入packages来进行整理
        for(let feature of features){
            if(platform_features.features[feature]){
                packages.push(platform_features.features[feature])
            }
        }
        
        //初始化将要构造的dependencies，如果已经存在这个配置，或者是上面已经写入了
        const dependencies:any=npm_package.dependencies?npm_package.dependencies:{}

        //将packages中已经整理好的包依次set进dependencies
        for(let _package of packages){
            //如果发现这个包不支持就放弃添加
            if(platform_features?.unsupported_packages?.includes(_package[0]))continue
            //如果发现这个包在当前平台内建了就放弃添加
            if(_package[0]=="internal")continue
            dependencies[_package[0]]=_package[1]
        }

        //将刚刚整理完的依赖的键写入整个package.json的对象中
        //如果该平台不支持任何提供的包，直接不添加dependencies项以防出错
        if(Object.keys(dependencies).length!=0){
            npm_package.dependencies=dependencies;
        }
    }

    //最后写入这个package.json
    File.forceWrite(plugin_conf.build_dir+"/"+platform+"/"+plugin_conf.plugin_dir_name+"/package.json",JSON.stringify(npm_package,undefined,4))
}

function run_lib_scripts(platform:string,file:string){
    //这个外层的if是用于判断当前是否配置了脚本，如果没有任何脚本文件就直接跳过
    if(File.ls("libs/"+plugin_conf.priorities.default[0]+"/libs/"+platform+"/scripts").includes(file)){
        const AfterCompileScriptTask=child_process.spawnSync("node",["libs/"+plugin_conf.priorities.default[0]+"/libs/"+platform+"/scripts/"+file])
        Logger.info(AfterCompileScriptTask.stdout.toString())
        if(AfterCompileScriptTask.stderr){
            Logger.info(AfterCompileScriptTask.stderr.toString())
        }
    }
}

function writeFeaturesIndex(){
    let FeaturesIndex=File.read("./lib/FeaturesIndex.ts")
    //第一步：匹配每段feature代码
    const FeaturesCodesRegExpArray=FeaturesIndex.match(/\/\/(\w+)>>(.*?)\/\/\1<</gs)
    let FeaturesCodes:string[]=[]
    if(FeaturesCodesRegExpArray!=null)for(let featureCodesRegExpArrayElement of FeaturesCodesRegExpArray){
        FeaturesCodes.push(featureCodesRegExpArrayElement)
    }
    //第二步：针对每段feature代码修改导出
    for(let featureCode of FeaturesCodes){
        //(?<=\/\/\w+>>)(.*?)(?=\/\/\w+<<)
        const featureNameMatchResult=featureCode.match(/\/\/(\w+)>>/s)
        if(featureNameMatchResult==null)throw new Error("FeaturesIndex中，对于"+featureCode+"部分定义feature名的语法不正确")
        const featureName=featureNameMatchResult[1]
        //如果plugin.json中的feature写了这个featureName，则证明后面的代码有需要该feature，不需要替换成undefined，直接路过
        //features可能未填写，如果未填写（undefined）就直接执行替换导出为undefined
        if(plugin_conf.features?.includes(featureName))continue;
        const featureExportCodeMatchResult=featureCode.match(/(?<=\/\/\w+>>)(.*?)(?=\/\/\w+<<)/s)
        if(featureExportCodeMatchResult==null)throw new Error("FeaturesIndex中，对于"+featureCode+"部分定义feature模块导出代码部分的语法不正确")
        const featureExportCode=featureExportCodeMatchResult[1]
        const exportedModulesMatchResults=featureExportCode.match(/[,{](.+?)(?=[,}])/sg)
        if(exportedModulesMatchResults==null)throw new Error("无法从FeaturesIndex中解析"+featureCode+"导出的模块");
        const featureExport:string[]=[]
        let undefinedExportStatement=""
        for(let featureExportCodeMatchResult of exportedModulesMatchResults){
            featureExportCodeMatchResult=featureExportCodeMatchResult.replace(/(.*as)|[\n{}, ]/sg,"")
            featureExport.push(featureExportCodeMatchResult)
            undefinedExportStatement=undefinedExportStatement+"export const "+featureExportCodeMatchResult+"=undefined\n"
        }
        FeaturesIndex=FeaturesIndex.replace(featureExportCode,"\n"+undefinedExportStatement+"\n")
    }
    File.forceWrite("./lib/FeaturesIndex.ts",FeaturesIndex)
}