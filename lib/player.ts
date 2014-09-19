//
// AcFun Html5 Player
// 模块: 播放器模块
//
// @author koukuko <9@acfun.tv>
//

class player {

    public shizuku;
    public playerElement;
    public videoElement;

    public videoSrc;
    public nowVideoSrc;
    public videoPart = [];
    public videoPartLength = 0;
    public currentTime = 0;
    public currentPart = 0;

    /**
     * 播放器父级控制器
     * @param shizuku
     */
    public bind(shizuku){
        this.shizuku = shizuku;
        this.playerElement = shizuku.playerElement;
    }

    /**
     * 终止播放器执行，销毁所有资源
     * @return boolean
     */
    public destruct(){

    }

    /**
     * 载入视频
     * @param videoSrc mixed 源地址
     */
    public load(videoSrc){

        this.videoSrc = videoSrc;

        // 优先使用高清画质
        this.nowVideoSrc = videoSrc['C80'] ||videoSrc['C70'] ||videoSrc['C60'] || videoSrc['C50'] || videoSrc['C40'] || videoSrc['C30'] || videoSrc['C20'] || videoSrc['C10'];

        // 告知长度
        this.playerElement.controller.line.total.text(this.formatSecond(this.nowVideoSrc.totalseconds));
        this.playerElement.controller.line.output.range.attr('max',this.nowVideoSrc.totalseconds);

        this.prepare(this.nowVideoSrc);

    }

    /**
     * 准备视频，初始化
     */
    public prepare(nowVideoSrc){

        var self = this;

        self.videoPartLength = nowVideoSrc['files'].length;

        for(var i in nowVideoSrc['files']){

            self.videoPart.push(nowVideoSrc['files'][i].seconds);

            // 创建并准备元素
            var c = document.createElement('video');
            c.src = nowVideoSrc['files'][i].url;
            c.preload = 'metadata';
            c.controls = false;
            $(c).data('part',i).addClass('container-video-entity').appendTo(this.playerElement.container.video);

            $(c)
                .on('play',function(){

                    // 一旦一个视频开始播放，那么将其设定为active并暂停其他视频
                    self.videoElement.removeClass('active');
                    $(this).addClass('active');

                    self.videoElement.each(function(){
                        if($(this).data('part')!= self.currentPart){
                            $(this)[0].pause();
                        }
                    });

                })
                .on('canplaythrough',function(){
                    self.preloadNextPart($(this).data('part'));
                })
                .on('ended',function(){
                    self.playNextPart($(this).data('part'));
                })
                .on('timeupdate',function(){

                    var currentTime = 0;

                    for (var j = 0; j <= self.currentPart; j++){
                        if(self.currentPart == j){
                            currentTime += Math.floor(this.currentTime);
                        } else {
                            currentTime += self.videoPart[j];
                        }
                    }

                    self.currentTime = currentTime;

                    self.playerElement.controller.line.now.text(self.formatSecond(self.currentTime));
                    self.playerElement.controller.line.output.played.width((self.currentTime/self.nowVideoSrc.totalseconds)*100+'%')
                    self.playerElement.controller.line.output.range.val(self.currentTime);

                });


        }

        self.videoElement = $('.container-video-entity');

        // 使第一个视频可以自动载入
        self.videoElement.eq(0).attr('preload','auto').addClass('active');
        self.currentTime = 0;
        self.playerElement.controller.line.now.text('00:00');

        // 分段视频自动切换



    }

    /**
     * 载入下一个分段
     */
    private preloadNextPart (i){

        i = parseInt(i);

        if( (i+1) < this.videoPartLength){
            this.videoElement.eq(i+1).attr('preload','auto');
        }

    }

    /**
     * 播放下一个分段
     */
    private playNextPart(i) {

        i = parseInt(i);

        this.videoElement.eq(i)[0].pause();

        if( (i+1) < this.videoPartLength){
            this.videoElement.eq(i+1)[0].currentTime = 0;
            this.videoElement.eq(i+1)[0].play();
            this.currentPart = i + 1;
        }

    }

    /**
     * 将秒转换为xx:xx格式
     */
    private formatSecond(s){
        var t = '00:00';
        if (s > -1) {
            var min = Math.floor(s / 60);
            var sec = Math.floor(s % 60);
            if (min < 10) {
                t = "0";
            } else {
                t = ""
            }
            t += min + ":";
            if (sec < 10) {
                t += "0";
            }
            t += sec;
        }
        return t;
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
        if(this.videoElement.filter('.active')){
            this.videoElement.filter('.active')[0].pause();
        } else if(this.videoElement.eq(0)) {
            this.videoElement.eq(0).addClass('.active');
        } else {
            console.error('没有播放元素');
        }
    }

    /**
     * 开始播放
     * @return boolean this.status.paused
     */
    public play(){
        if(this.videoElement.filter('.active')){
            this.videoElement.filter('.active')[0].play();
        } else if(this.videoElement.eq(0)) {
            this.videoElement.eq(0).addClass('.active');
            this.videoElement.eq(0)[0].play();
        } else {
            console.error('没有播放元素');
        }

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