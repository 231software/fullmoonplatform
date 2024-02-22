export enum FMPDefaultDimension{
    Overworld=0,
    Nether,
    TheEnd,
    NotDefault
}
export class FMPDimension{
    dimid:number;
    static getDefaultDimension(dimid:number):FMPDimension{
        return new FMPDimension();
    }
}