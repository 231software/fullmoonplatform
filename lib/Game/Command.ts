import { FMPInternalPermission } from "./InternalPermission";
export enum FMPCommandParamType{
    Optional=1,
    Mandatory
}
export enum FMPCommandParamDataType{
    Boolean=0,
    Int,
    Float,
    String,
    Actor,
    Player,
    IntLocation,
    FloatLocation,
    RawText,
    Message,
    JsonVale,
    Item,
    Block,
    Effect,
    Enum,
    SoftEnum,
    ActorType,
    Command
}
export class FMPCommandEnum{
    name:string;
    values:Array<string>;
    constructor(name:string,values:Array<string>){
    }
}
export enum FMPCommandEnumOptions{
    Default=0,
    Unfold
}
export class FMPCommandParam{
    type:FMPCommandParamType;
    /** 参数名，会显示在命令提示中，同一命名中请勿重复 */
    name:string;
    dataType:FMPCommandParamDataType;
    bindEnum:FMPCommandEnum|undefined;
    enumOptions:FMPCommandEnumOptions;
    constructor(
        type:FMPCommandParamType,
        name:string,
        dataType:FMPCommandParamDataType,
        bindEnum:FMPCommandEnum|undefined=undefined,
        enumOptions:FMPCommandEnumOptions=FMPCommandEnumOptions.Default
    ){
    }
}
export enum FMPCommandExecutorType{
    Player=0,
    Entity,
    Console,
    CommandBlock,
    Unknown
}
export class FMPCommandExecutor{
    /** 命令执行者原始对象 */
    object:any
    type:FMPCommandExecutorType
    constructor(object,type:FMPCommandExecutorType){
        this.object=object;
        this.type=type;
    }
}
export class FMPCommandResult{
    executor:FMPCommandExecutor
    params:any
    constructor(executor:FMPCommandExecutor,params:any){
        this.executor=executor
        this.params=params
    }
}
export abstract class FMPCommand{
    name:string;
    description:string|undefined;
    usageMessage:string|undefined;
    args:Array<FMPCommandParam>;
    overloads:Array<Array<string>>;
    permission:FMPInternalPermission;
    aliases:Array<string>;
    flag:any;
    /**
     * 
     * @param name 
     * @param description 
     * @param usageMessage 
     * @param args 
     * @param overloads 
     * @param permission 
     * @param aliases 对于LLSE，由于只支持一个别名，所以仅有数组最后一个元素会作为该唯一的别名。
     * @param flag 
     */
    constructor(
        name:string,
        description:string|undefined=undefined,
        usageMessage:string|undefined=undefined,
        args:Array<FMPCommandParam>=[],
        overloads:Array<Array<string>>=[[]],
        permission:FMPInternalPermission=FMPInternalPermission.GameMasters,
        aliases:Array<string>=[],
        flag:any=undefined
    ){
    }
    abstract callback(result:FMPCommandResult):void
    static register<T extends FMPCommand>(command:T):boolean{
        return false;
    }
}