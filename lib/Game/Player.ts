import { FMPInternalPermission } from "./InternalPermission";
import { FMPEulerAngles, FMPLocation } from "./Location";
import {FMPItem} from "./Item.js"
/**
 * FMP定义的游戏模式  
 * 以Minecraft中的游戏模式为主，也可包括其他游戏中的游戏模式  
 * 各模式在各游戏中对应的模式详见各枚举名注释
 */
export enum FMPGameMode{
    Survival=0,
    Creative,
    Adventure,
    Spectator,
    Unknown
}
/**
 * FMP定义的玩家  
 * 由于平台不同，不能在不对运行环境做任何限制的前提下假定此为Minecraft中的玩家
 */
export class FMPPlayer{
    /** 玩家在Minecraft基岩版中的xuid */
    xuid:string;
    /** 玩家的游戏ID */
    name:string;
    /** 玩家在游戏内显示的名称 */
    displayName:string;
    /** 玩家在游戏世界中的坐标 */
    location:FMPLocation
    /**玩家的UUID（Unique UID） */
    get uuid():string{
        return ""
    }
    /** 玩家的游戏模式 */
    get gameMode():FMPGameMode{
        return FMPGameMode.Unknown
    }
    /** 获取玩家在游戏世界中的朝向 */
    get direction():FMPEulerAngles{
        return FMPEulerAngles.new(0,0,0)
    }
    /**玩家对于游戏内置权限的权限等级 */
    get internalPermission():FMPInternalPermission{
        return FMPInternalPermission.Any
    }
    /**
     * 给予玩家一个物品
     * @param item 要给予玩家的物品
     * @returns 是否成功给予玩家
     */
    giveItem(item:FMPItem):boolean{
        return false
    }
    /**
     * 在游戏内向玩家发送一条消息，没有任何前缀
     * @returns 是否发送成功
     */
    tell(message:string):boolean{
        return false;
    }
    /** 在游戏世界中传送玩家到指定坐标 */
    teleport(location:FMPLocation,direction?:FMPEulerAngles):boolean{
        return false;
    }
    /** 更改玩家的游戏模式 */
    setGameMode(gameMode:FMPGameMode):boolean{
        return false;
    }
    /**
     * 调用加载器或插件内数据库通过玩家名查询其UUID
     * @param name 玩家游戏名
     * @returns 玩家UUID
     */
    static name2uuid(name:string):string|undefined{
        return undefined
    }
    /**
     * 调用加载器或插件内数据库通过玩家XUID查询其UUID  
     * 玩家不一定通过xbox登录服务器，所以该函数可能总是返回undefined
     * @param xuid 玩家XUID
     * @returns 玩家UUID
     */
    static xuid2uuid(xuid:string):string|undefined{
        return undefined
    }
    /**
     * 调用加载器或插件内数据库通过玩家UUID查询玩家名
     * @param uuid 玩家UUID
     * @returns 玩家名
     */
    static uuid2name(uuid:string):string|undefined{
        return undefined
    }
    /**
     * 调用加载器或插件内数据库通过玩家UUID查询玩家XUID  
     * 玩家不一定通过xbox登录服务器，所以该函数可能总是返回undefined
     * @param uuid 玩家UUID
     * @returns 玩家XUID
     */
    static uuid2xuid(uuid:string):string|undefined{
        return undefined
    }
    /**
     * 通过玩家对应的字段获取玩家
     * @param prividedID 玩家的游戏名/UUID/XUID
     * @returns 玩家在线时返回该玩家对象，不在线的返回undefined
     */
    static getOnlinePlayer(providedID:string):FMPPlayer|undefined{
        return undefined
    }
}