import { FMPLogger,FMPInitEvent } from "../lib/index.js";
import {INFO} from "../lib/plugin_info.js"
FMPInitEvent.on((e)=>{
    FMPLogger.info("This Full Moon Platform plugin successfully loaded.");
    return true;
})