import {FMPPlayer} from "./Game/Player.js";
import { FMPLogger } from "./Logger.js";
import { FMPSQLDBDataType } from "./SQLite3.js";
export class FMPSimpleForm{
    title:string
    content:string
    buttons:FMPSimpleFormButton[]=[]
    onClose:(player:FMPPlayer)=>void
    /**
     * 
     * @param title 表单标题
     * @param content 表单第一行显示的说明文字
     * @param buttons 表单中的所有按钮
     * @param onClose 表单被关闭（点击叉）时要触发的函数
     */
    constructor(title=" ",content="",buttons:FMPSimpleFormButton[]=[],onClose?:(player:FMPPlayer)=>void) {
        this.title=title
        this.content=content
        this.buttons=buttons;
        this.onClose=onClose!=undefined?onClose:()=>{};
        this.build();
    }
    /**
     * 向指定玩家发送表单
     * @param player 表单要发送给的玩家
     * @param lastForm 
     */
    send(formSession:FMPSimpleFormSession){
        
    }
    build(){

    }
}
/*
export class FMPSimpleFormBindedPlayer extends FMPSimpleForm{
    player:FMPPlayer
    constructor(player:FMPPlayer,title=" ",content="",buttons:(FMPSimpleFormButton|FMPSimpleFormButtonJump)[]=[],onClose?:(player:FMPPlayer)=>void) {
        for(let i in buttons){
            if(buttons[i] instanceof FMPSimpleFormButtonJump){
                const jumpButton = buttons[i] as FMPSimpleFormButtonJump; // 为了能把原来的元素改变类型但是又需要访问原类型里的属性，chatgpt推荐了类型断言
                buttons[i]=new FMPSimpleFormButton(buttons[i].name,buttons[i].text,
                    (player)=>{
                        jumpButton.nextForm.send(player);
                    },
                    buttons[i].image)
                
            }
        }
        super(title,content,buttons,onClose)
        this.player=player
    }
}*/

export class FMPSimpleFormButton{
    name:string;
    text:string;
    callback:(formSession:FMPSimpleFormSession)=>void
    image:string|undefined;
    type:FMPSimpleFormButtonType
    /**
     * 
     * @param name 按钮名字
     * @param text 按钮上显示的内容
     * @param callback 按钮的回调
     * @param image 按钮左侧要显示的图片的网络或本地路径，可空
     */
    constructor(name:string,text:string,callback:(formSession:FMPSimpleFormSession)=>void,image?:string,type:FMPSimpleFormButtonType=FMPSimpleFormButtonType.Common){
        this.name=name;
        this.text=text;
        this.callback=callback;
        this.image=image;
        this.type=type;
    }
}
export enum FMPSimpleFormButtonType{
    Common,
    Back,
    Minimize,
    MultiTask
}

export class FMPSimpleFormSession{
    form:FMPSimpleForm
    player:FMPPlayer
    lastSession:FMPSimpleFormSession
    constructor(form:FMPSimpleForm,lastSessionOrPlayer:FMPSimpleFormSession|FMPPlayer){
        /**为了防止后续对原始表单的修改导致全局的表彰发生变化，就在这里把原表单的按钮列表拷贝一份*/
        const originalFormButtons=form.buttons
        //传入了表单会话，指明了跳转来源，就可以使用这个跳转来源进行后退操作了。
        if(lastSessionOrPlayer instanceof FMPSimpleFormSession){
            this.lastSession=lastSessionOrPlayer
            this.player=this.lastSession.player
            const backButton=new FMPSimpleFormButton("返回","<===",(session)=>{//这里接收到的会话是后退的来源，可以用来前进
                lastSessionOrPlayer.send()
            },undefined,FMPSimpleFormButtonType.Back);
            //表单按钮列表的第一个是返回键
            if(originalFormButtons[0]?.type==FMPSimpleFormButtonType.Back){
                originalFormButtons[0]=backButton;
            }
            else{
                originalFormButtons.unshift(backButton)
            }
        }
        this.form=new FMPSimpleForm(form.title,form.content,originalFormButtons,form.onClose)
        //只传入了玩家却不传入表单，证明没有上个表单
        if(lastSessionOrPlayer instanceof FMPPlayer){
            this.player=lastSessionOrPlayer
        }
    }
    send():boolean{
        if(this.lastSession!=undefined){
            this.form.send(this);
            return true;
        }
        if(this.player!=undefined){
            this.form.send(this)
            return true;
        }
        FMPLogger.warn("表单发送失败，没有提供任何应该收到表单的玩家，因为无法从上级表单或传入参数指定发送者中的任何一个方式获取当前表单会话所属玩家")
        return false;
    }
    
}

/*
export class FMPSimpleFormButtonJump extends FMPSimpleFormButton{
    nextForm:FMPSimpleForm
    constructor(name:string,text:string,nextForm:FMPSimpleForm,session:FMPSimpleFormSession,image?:string){
        super(name,text,
            (player)=>{
                nextForm.send(player)
            }
            ,image);
        this.nextForm=nextForm
    }
}*/