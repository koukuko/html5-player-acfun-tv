/**
 * AcFun Html5 Player
 * 模块: 播放器模块
 *
 * @author koukuko <9@acfun.tv>
 */

class player {

    /**
     * 构造函数
     */
    constructor(){

    }

    /**
     * 创建html框架的播放器
     */
    private generatePlayer(){

    }

    /**
     * 终止播放器执行，销毁所有资源
     * @return boolean
     */
    public destruct(){

    }

    /**
     * 载入视频
     * @param sourceUrl mixed 源地址 可为字符串或者数组
     * @param startTime float 起始时间
     * @return array 源地址
     */
    public load(sourceUrl,startTime){

    }

    /**
     * 静音
     * @return boolean this.status.muted
     */
    public mute(){

    }

    /**
     * 暂停，暂停当前的播放
     * @return boolean this.status.paused
     */
    public pause(){

    }

    /**
     * 开始播放
     * @return boolean this.status.paused
     */
    public play(){

    }

    /**
     * 恢复播放
     * @return boolean this.status.paused
     */
    public resume(){

    }

    /**
     * 跳转到指定位置
     * @param msecOffset int 毫秒偏差
     */
    public setPosition(msecOffset){

    }

    /**
     * 设置音量
     * @param volume int 音量 0-100
     * @return int this.status.volume
     */
    public setVolume(volume){

    }

    /**
     * 停止播放
     * @return boolean this.status.paused
     */
    public stop(){

    }

    /**
     * 切换静音
     */
    public toggleMute(){

    }

    /**
     * 切换暂停
     */
    public togglePause(){

    }

    /**
     * 取消载入
     */
    public unload(){

    }

    /**
     * 取消静音
     */
    public unmute(){

    }

}