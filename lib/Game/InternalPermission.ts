/** 截至1.20.60原版一共有6个any最低internal最高 */
export enum FMPInternalPermission{
    Any=0,
    Admin,
    /**一般情况下服务器的OP是这个等级 */
    GameMasters,
    HostPlayer,
    Console,
    Internal
}