export class Logger{
    static info(...args:any){
        console.log(...args);
    }
    static warn(...args:any){
        console.warn(...args);
    }
    static error(...args:any){
        console.error(...args);
    }
    static fatal(...args:any){
        
    }
}