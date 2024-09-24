import { TwoWayMap } from "../Tools";

export enum FMPDefaultDimension{
    NotDefault=-1,
    Overworld=0,
    Nether,
    TheEnd
}
export const DefaultDimensionName=new TwoWayMap(new Map([
    [-1,"非原版维度"],
    [0,"主世界"],
    [1,"下界"],
    [2,"末地"]
]))
export class FMPDimension{
    defaultDimension:FMPDefaultDimension
    name:string
    constructor(defaultDimensionOrName:FMPDefaultDimension|string){
        //通过默认维度生成fmp维度的方法
        if(typeof defaultDimensionOrName!="string"){
            this.defaultDimension=defaultDimensionOrName;
            this.name=DefaultDimensionName.toRight(defaultDimensionOrName)
            return;
        }
        this.name=defaultDimensionOrName;
        this.defaultDimension=FMPDefaultDimension.NotDefault;
    }
    static getDefaultDimension(defaultDimension:FMPDefaultDimension):FMPDimension{
        return new FMPDimension(defaultDimension);
    }
}