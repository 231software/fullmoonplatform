import * as fs from "fs";
import { FMPLogger } from "./Logger";
export class FMPFile{
    static ls(path:string):string[]{
        try{
            return fs.readdirSync(path)
        }
        catch(e){
            FMPLogger.error(e);
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
    static read(path:string):string{
        try{
            return fs.readFileSync(path).toString();
        }
        catch(e){
            FMPLogger.error(e);
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
            FMPLogger.error(e);
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