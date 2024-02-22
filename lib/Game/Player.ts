import { FMPLocation } from "./Location";

export enum FMPGameMode{
    Survival=0,
    Creative,
    Adventure,
    Spectator,
    Unknown
}
export class FMPPlayer{
    xuid:string;
    name:string;
    location:FMPLocation
    gameMode:FMPGameMode
    teleport(location:FMPLocation):boolean{
        return false;
    }
    setGameMode(gameMode:FMPGameMode):boolean{
        return false;
    }
}