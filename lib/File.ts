import * as fs from "fs";
import { FMPLogger } from "./Logger";
export class FMPFile{
    static ls(path:string):string[]{
        try{
            return fs.readdirSync(path)
        }
        catch(e){
            //FMPLogger.error(e);
            throw new Error("无法列出"+path+"中的文件！\nnodejs报错：\n"+e)
        }
    }
    /**
     * 新建文件夹  
     * 如果当前目录已有同名文件夹，则不执行任何操作
     * @param path 要新建的文件夹的路径，如果要在程序当前工作目录下新建，直接传入文件夹名即可
     */
    static initDir(path:string){
        try{
            fs.readdirSync(path);
        }
        catch(e){
            fs.mkdirSync(path);
        }
    }
    /**
     * 新建文件夹  
     * 如果当前目录已有同名文件夹，则不执行任何操作
     * @param path 要新建的文件夹的路径，如果要在程序当前工作目录下新建，直接传入文件夹名即可
     */
    static initFile(path:string){
        try{
            fs.readFileSync(path)
        }
        catch(e){
            //新建文件逻辑未完成
        }
    }
    /**
     * 同步读取并返回文件的全部内容  
     * 请勿使用此方法读取大文件，否则会导致读取过程中服务器卡顿甚至无响应（假死）
     * @param path 文件路径
     * @returns 文件内容
     */
    static read(path:string):string{
        try{
            return fs.readFileSync(path).toString();
        }
        catch(e){
            throw new Error("读取文件时发生错误！错误消息为：\n"+e);
        }
    }
    static copy(source:string,destination:string){
        try{
            fs.cpSync(source,destination,{recursive:true});
        }
        catch(e){
            FMPLogger.error(e)
        }
    }
    /**
     * 强制向文件内写入文本内容，无视其中是否有内容、格式是否为文本文件  
     * 请不要依赖此API对所有文件执行写入操作，由于写入时没有判断，操作不当可能会造成数据丢失或程序运行出现错误
     * @param path 要写入的文件的路径
     * @param content 要写入的内容
     */
    static forceWrite(path:string,content:string){
        const target=fs.openSync(path,"w+");
        fs.writeFileSync(path,content);
        fs.close(target);
    }
    /**
     * 重命名或移动一个文件  
     * 要移动文件，修改其路径即可
     * @param path 文件路径
     * @param target 重命名后的文件名（路径）
     */
    static rename(path:string,target:string){
        try{
            fs.renameSync(path,target);
        }
        catch(e){
            //FMPLogger.error(e);
            throw new Error("移动文件时出现异常！\nnodejs报错：\n"+e)
        }
    }
    /**
     * 永久删除一个文件或文件夹，不放入系统回收站  
     * 尽量不使用此方法，文件删除后无法恢复，有数据安全隐患
     * @param path 文件或文件夹路径
     */
    static permanently_delete(path:string){
        const file_stat=fs.statSync(path)
        try{
            if(file_stat.isFile()){
                fs.unlinkSync(path);
            }
            else if(file_stat.isDirectory()){
                //清空文件夹
                for(let filename of this.ls(path)){
                    this.permanently_delete(path+"/"+filename);
                }
                //删除文件夹
                fs.rmdirSync(path);
            }
        }
        catch(e){
            FMPLogger.error(e)
        }
    }
}
export class FMPDirectory{
    folders:string[];
    constructor(dir:string){
        this.folders=dir.split(/[/|\\]/);
    }
    toString(backslash=true):string{
        let target:string="";
        for(let i in this.folders){
            target=target+this.folders[i];
            if(Number(i)!=this.folders.length-1){
                target=target+(backslash?"\\":"/");
            }
        }
        return target;
    }
}
export class JsonFile{
    fileContent:string;
    path:string;
    objpath:string[];
    rootobj:any;
    /**
     * 
     * @param {string} path 文件路径
     * @param {Array<string>} objpath 在JSON文件内部的路径
     */
    constructor(path:string,objpath:string[]=[]){
        //先把文件建出来
        FMPFile.initFile(path);
        this.path=path;
        this.objpath=objpath
        if(objpath.length!=0){
            const checkObjAvailable=(checkPath:any,index:number)=>{
                if(index>objpath.length-1){return;}
                //log(objpath[index])
                //log(typeof checkPath[objpath[index]])
                //log(checkPath[objpath[index]])
                //log(index)
                if(typeof checkPath[objpath[index]]!="object"){
                    let errorPath=objpath
                    errorPath.splice(index+1)
                    FMPLogger.error("Cannot generate in the path:"+JSON.stringify(errorPath))
                    return;
                }
                checkObjAvailable(checkPath[objpath[index]],index+1);
            }          
            checkObjAvailable(this.rootobj,0);//这里的递归只是起到一个检查的作用
        }
    }
    /**
     * 初始化配置项，要求可以对嵌套着的对象初始化
     * @param key 键名
     * @param value 键值
     */
    init(key:string,value:any){//重写只能放构造里面，放别的地方不行，我也不知道为啥
        if(this.objpath.length==0){
                      
        }
        else{
            let set=this.set//由于this.set传不进去initValue，所以在这里单独声明一个变量接力一下
            let get=this.get
            if(get(key)===undefined){
                set(key,value)
            }
        }
    }
    /**
     * 通过递归读取目标的值
     * @param {string} key 要读取的键值
     */
    get(key:string){
        let objpath=this.objpath;
        if(this.objpath.length==0){
            //log("从根目录直接获取值")
            return this.rootobj[key];
        }
        else{
            return getValue(this.rootobj,0);
        }
        /**
         * 专用来递归访问对象的函数
         * @param obj 
         * @param index 
         * @returns ？？这里好像写的有问题，但是竟然能运行  草，果然有问题，刚才就发现了
         */
        function getValue(obj:Object,index:number){
            //log(objpath[index])
            //log("JsonFile "+index)
            if(index>=objpath.length-1){//length-1是最后一个元素的索引，如果到达这个索引，就证明应该读取这一级目录中的值了
                //log("JsonFile "+JSON.stringify(obj[objpath[index]]))
                //log("JsonFile "+JSON.stringify(obj[objpath[index]][key]))
                return obj[objpath[index]][key]
            }else{
                return getValue(obj[objpath[index]],index+1)
            }
        }
    }
    /**
     * 通过递归写入目标的值，不影响沿途其他键;
     * 这个过程仍会调用父类的get和set
     * @param key 键名
     * @param value 键值
     */
    set(key:string,value:any){//set之后要把rootobj重新生成一下
        let result=true;
        if(this.objpath.length==0)setRoot(key,value)
        else{
            let root=this.rootobj[this.objpath[0]];
            //log("输入set的："+JSON.stringify(setValue(rootobj,0,value)))
            //log(JSON.stringify(setValue(rootobj[objpath[0]],0,value)))
            result=setRoot(this.objpath[0],setValue(this.rootobj[this.objpath[0]],0,value));                
        }
        function setRoot(key:string,value:any):boolean{
            this.rootobj[key]=value
            FMPFile.forceWrite(this.path,JSON.stringify(this.rootobj));
            return true;
        }
        function setValue(obj:any,index:number,value:any){
            //log(objpath[index])
            //log(obj)
            if(index>=this.objpath.length-1){
                let write=obj;
                //let shell;shell[objpath[0]]=fatherGet;
                write[key]=value;
                return write;
            }                
            else{//obj[objpath[index]]是传进去的，要被修改的部分
                let write=obj;
                write[this.objpath[index+1]]=setValue(obj[this.objpath[index+1]],index+1,value)
                //log(JSON.stringify(write,0,4))
                return write
            }
        } 
        this.reload();
        return result;
    }
    reloadroot():boolean{
        this.fileContent=FMPFile.read(this.path)
        this.rootobj=JSON.parse(this.fileContent);
        return true;
        //this.keys=this.getAllKeys(this.rootobj);
    }
    reload():boolean{
        return this.reloadroot();
    }
    getAllKeys(obj:any,index=0){
        if(this.objpath.length==0){
            return Object.keys(this.rootobj)
        }
        //log(JSON.stringify(obj[objpath[index]]))
        if(index>=this.objpath.length-1){//length-1是最后一个元素的索引，如果到达这个索引，就证明应该读取这一级目录中的值了
            
            return Object.keys(obj[this.objpath[index]])
        }else{
            return this.getAllKeys(obj[this.objpath[index]],index+1)
        }
    }        
    keys():string[]{
        return this.getAllKeys(this.rootobj);//Object.keys(rootobj);
    }
    /*
    get obj():any{
        return this.rootobj;
    }*/
    static get version(){
        return "0.0.1";
    }
}