/**
 * AcFun Html5 Player
 *
 * @version 北山しずく 3.0.1
 * @author Akino Mizuho.Koukuko <9@acfun.tv>
 */

/// <reference path='interface.d.ts'/>
/// <reference path='settings.prod.ts'/>
/// <reference path='utility.ts'/>
/// <reference path='player.ts'/>
/// <reference path='jquery.d.ts'/>

class shizuku {

    public hash;
    public hashOptions;

    public player = new player();
    public playerElement;
    public videoSrc;

    constructor(){

        var self = this;

        // 1. 绑定播放器动作
        self.bindPlayerElement();

        // 2. 通过hash获取参数
        self.hash = location.hash;
        self.hashOptions = _.readHash(self.hash);

        if(!self.hashOptions || !self.hashOptions.vid){
            self.preloadError('#0 初始化失败','参数错误');
        }

        // 3. 解析视频

        var vid = self.hashOptions.vid;

        $.getJSON(settings.httpJiexiUrl+'?type=html5&vid='+vid)
            .then(function(data){
                if(data && typeof data == 'object' && data.success){

                    self.playerElement.preLoad.root.fadeOut();

                    self.videoSrc = data.result;

                    // JUMP
                    // 至此开始进入player.ts 转交控制权
                    if(self.videoSrc && (self.videoSrc['C10'] || self.videoSrc['C20'] || self.videoSrc['C30'] || self.videoSrc['C40'] || self.videoSrc['C50'])){
                        self.player.load(self.videoSrc);
                    } else {
                        self.preloadError('#4 视频解析失败:'+vid,'没有可用的视频源');
                    }

                } else {
                    if(data && typeof data == 'object' ){
                        self.preloadError('#1 视频解析失败:'+vid,data.message);
                    } else {
                        self.preloadError('#2 视频解析失败:'+vid,'未知原因');
                    }
                }
            })
            .fail(function(error){
                self.preloadError('#3 视频解析失败:'+vid,'网络通讯失败');
            });

    }

    /**
     * 1. 初始化播放器元素
     */
    private bindPlayerElement(){

        this.playerElement = {
            preLoad : {
                root: $('.preload'),
                icon: $('.preload .preload-icon'),
                version: $('.preload .preload-version'),
                hint: $('.preload .preload-hint')
            },
            container:{
                root: $('.container'),
                video: $('.container .container-video'),
                danmaku: $('.container .container-danmaku')
            },
            controller:{
                root: $('.controller'),
                play: $('.controller .controller-btn-play'),
                fullScreen: $('.controller .controller-btn-fullscreen'),
                line: {
                    root: $('.controller .controller-line'),
                    now: $('.controller .controller-line-now'),
                    total: $('.controller .controller-line-total'),
                    output: {
                        loaded: $('.controller .controller-line-output-loaded'),
                        played: $('.controller .controller-line-output-played'),
                        range: $('.controller .controller-line-output-range')
                    }
                }
            }
        };

        this.player.bind(this);

    }


    /**
     * 初始化报错提示
     * @params message {string} 报错提示字符串
     */
    private preloadError(message,etc?){

        console.error(message,etc);

        this.playerElement.preLoad.icon.fadeOut();
        if(etc){
            this.playerElement.preLoad.version.text(message);
            this.playerElement.preLoad.hint.text(etc);
        } else  {
            this.playerElement.preLoad.hint.text(message);
        }

    }

}