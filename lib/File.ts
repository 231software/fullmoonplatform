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
    static initDir(path:string){
        try{
            fs.readdirSync(path);
        }
        catch(e){
            fs.mkdirSync(path);
        }
    }
    static initFile(path:string){
        try{
            fs.readFileSync(path)
        }
        catch(e){
            
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