import { FMPLogger,FMPInitEvent } from "../lib/index.js";
FMPInitEvent.on((e)=>{
    FMPLogger.info("This Full Moon Platform plugin successfully loaded.");
    return true;
})