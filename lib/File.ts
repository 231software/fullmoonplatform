import * as fs from "fs";
import { Logger } from "./Logger";
export class File{
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
    static copy(source:string,destination:string){
        try{
            fs.cpSync(source,destination,{recursive:true});
        }
        catch(e){
            Logger.error(e)
        }
    }
    static forceWrite(path:string,content:string){
        const target=fs.openSync(path,"w+");
        fs.writeFileSync(path,content);
        fs.close(target);
    }
    static delete(path:string){
        fs.unlinkSync(path);
    }
}
export class Directory{
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