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

    public tryResume = 0;
    public tryReConnect = 0;

    public lockSeek = false;
    public lockTouch = false;
    public lockHide = false;

    public lockHideTimer;

    /**
     * 播放器父级控制器
     * @param shizuku
     */
    public bind(shizuku) {
        this.shizuku = shizuku;
        this.playerElement = shizuku.playerElement;
    }

    /**
     * 终止播放器执行，销毁所有资源
     * @return boolean
     */
    public destruct() {
        this.videoElement.remove();
    }

    /**
     * 载入视频
     * @param videoSrc mixed 源地址
     */
    public load(videoSrc) {

        var self = this;

        this.videoSrc = videoSrc;

        // 优先使用高清画质
        this.nowVideoSrc = videoSrc['C20'] || videoSrc['C80'] || videoSrc['C70'] || videoSrc['C60'] || videoSrc['C50'] || videoSrc['C40'] || videoSrc['C30'] ||  videoSrc['C10'];

        // 告知长度
        this.playerElement.controller.line.total.text(this.formatSecond(this.nowVideoSrc.totalseconds));
        this.playerElement.controller.line.output.range.attr('max', this.nowVideoSrc.totalseconds);

        // 获取弹幕
        $.getJSON(settings.danmakuUrl + '/' + this.shizuku.hashOptions.vid + '-' + Math.floor(Math.floor(this.nowVideoSrc.totalseconds / 60) * 100))
            .then(function (data) {
                if (data) {
                    var comment = [];
                    comment = comment.concat(data[0], data[1], data[2]);
                }
                var result = AcfunParser(JSON.stringify(comment));
                self.shizuku.danmaku.load(result);

                self.prepare(self.nowVideoSrc);

            });

    }

    /**
     * 准备视频，初始化
     */
    public prepare(nowVideoSrc) {

        var self = this;

        self.videoPartLength = nowVideoSrc['files'].length;

        for (var i in nowVideoSrc['files']) {

            self.videoPart.push(nowVideoSrc['files'][i].seconds);

            // 创建并准备元素
            var c = document.createElement('video');
            c.src = nowVideoSrc['files'][i].url;
            c.preload = 'metadata';
            c.controls = false;
            $(c).data('part', i).addClass('container-video-entity').appendTo(this.playerElement.container.video);

            $(c)
                .on('play', function () {

                    // 一旦一个视频开始播放，那么将其设定为active并暂停其他视频
                    self.videoElement.removeClass('active');
                    $(this).addClass('active');

                    self.videoElement.each(function () {
                        if ($(this).data('part') != self.currentPart) {
                            $(this)[0].pause();
                        }
                    });

                })
                .on('canplaythrough', function () {
                    self.preloadNextPart($(this).data('part'));
                })
                .on('ended', function () {
                    self.playNextPart($(this).data('part'));
                })
                .on('timeupdate', function () {

                    var currentTime = 0;

                    for (var j = 0; j <= self.currentPart; j++) {
                        if (self.currentPart == j) {
                            currentTime += Math.floor(this.currentTime);
                        } else {
                            currentTime += self.videoPart[j];
                        }
                    }

                    self.currentTime = currentTime;

                    self.playerElement.controller.line.now.text(self.formatSecond(self.currentTime));
                    self.playerElement.controller.line.output.played.width((self.currentTime / self.nowVideoSrc.totalseconds) * 100 + '%');

                    if (!self.lockSeek) {
                        self.playerElement.controller.line.output.range.val(self.currentTime);
                    }

                    self.shizuku.danmaku.time(self.currentTime * 1000);

                })
                .on('error', function () {
                    // 发生错误，重新尝试播放
                    if (!self.tryResume) {
                        if(self.getActiveVideoElement()[0].paused){
                            self.showTooltip('播放视频发生错误:尝试重新播放');
                        }
                    } else if (!self.tryReConnect) {

                        var currentTime = self.currentTime;
                        var paused = self.getActiveVideoElement()[0].paused;

                        self.showTooltip('播放视频发生错误:尝试重新载入');
                        self.destruct();
                        self.shizuku.loadVideo();

                        self.setPosition(currentTime);

                        if (!paused) {
                            self.play();
                        }

                    }
                });

        }

        self.videoElement = $('.container-video-entity');

        // 使第一个视频可以自动载入
        self.videoElement.eq(0).attr('preload', 'auto').addClass('active');
        self.currentTime = 0;
        self.playerElement.controller.line.now.text('00:00');

        // 播放按钮
        self.playerElement.controller.play.on('click', function () {

            var element = self.playerElement.controller.play.find('.controller-icon').removeClass('controller-icon-play controller-icon-pause');

            if (self.togglePause()) {
                element.addClass('controller-icon-play');
            } else {
                element.addClass('controller-icon-pause');
            }

        });

        self.playerElement.controller.fullScreen.on('click', function () {

            _.toggleFullScreen(self.playerElement.root[0]);

        });

        self.playerElement.controller.line.output.range.on('mousedown', function () {
            self.lockSeek = true;
        }).on('mousemove', function () {
            if (self.lockSeek) {
                self.showTooltip('跳转到 ' + self.formatSecond(self.playerElement.controller.line.output.range.val()));
            }
        }).on('mouseup', function () {
            self.setPosition(self.playerElement.controller.line.output.range.val());
            self.lockSeek = false;
        }).on('touchstart', function () {
            self.lockSeek = true;
        }).on('touchmove', function () {
            if (self.lockSeek) {
                self.showTooltip('跳转到 ' + self.formatSecond(self.playerElement.controller.line.output.range.val()));
            }
        }).on('touchend', function () {
            self.setPosition(self.playerElement.controller.line.output.range.val());
            self.lockSeek = false;
        });
        // 触摸设备操作
        var firstTouch, lastTouch, typeTouch, valueTouch;
        self.playerElement.container.danmaku
            .on('dblclick', function () {
                _.toggleFullScreen(self.playerElement.root[0]);
            })
            .on('click', function () {
                self.toggleHideController();
            })
            .on('touchstart', function (e) {
                firstTouch = e.originalEvent.targetTouches[0];
                self.lockTouch = true;
            })
            .on('touchmove', function (e) {
                lastTouch = e.originalEvent.targetTouches[0];
                // 确定操作类型
                if (!typeTouch && firstTouch && lastTouch) {
                    if (Math.abs(lastTouch.pageX - firstTouch.pageX) > 150) {
                        typeTouch = 'seek';
                    } else if (Math.abs(lastTouch.pageY - firstTouch.pageY) > 150) {
                        typeTouch = 'vol';
                    }
                }
                if (typeTouch) {
                    var text = '';
                    if (typeTouch == 'seek') {
                        text += '跳转到 ';
                        valueTouch = (lastTouch.pageX - firstTouch.pageX) / self.videoElement.width();
                        valueTouch = self.currentTime + 120 * valueTouch;
                        if (valueTouch < 0) {
                            valueTouch = 0
                        } else if (valueTouch > self.nowVideoSrc.totalseconds) {
                            valueTouch = self.nowVideoSrc.totalseconds
                        }
                        text += self.formatSecond(valueTouch);
                    }
//                    else if (typeTouch == 'vol') {
//                        text += '音量：';
//                        valueTouch = (firstTouch.pageY - lastTouch.pageY ) / self.element.offsetWidth;
//                        valueTouch = self.element.volume + valueTouch;
//                        if (valueTouch < 0) {
//                            valueTouch = 0
//                        } else if (valueTouch > 1) {
//                            valueTouch = 1
//                        }
//                        text += Math.floor(valueTouch * 100) + '%';
//                    }
                    self.showTooltip(text);
                }
            }).on('touchend', function (e) {
                if (typeTouch) {
                    if (typeTouch == 'seek') {
                        self.setPosition(valueTouch);
                    }
//                    else if (typeTouch == 'vol') {
//                        self.element.volume = valueTouch;
//                    }
                    typeTouch = undefined;
                    valueTouch = undefined;
                }
                self.lockTouch = false;
            });

        // 自动隐藏控制栏
        setInterval(function(){
            if(!(self.lockSeek || self.lockTouch || self.lockHide)){
                self.hideController();
            }
        },5000);

        self.setBounds();

        $(window).on('resize', function () {
            self.setBounds();
        });

    }

    /**
     * 设置弹幕边界和滚动速度
     */
    private setBounds() {
        settings.commentLifeTime = Math.floor(window.innerWidth * 7.14);
        this.shizuku.danmaku.setBounds();
    }

    /**
     * 隐藏控制栏
     */
    private toggleHideController(){

        var self = this;
        var element = self.playerElement.controller.root;

        if(element.hasClass('fadeOutDown')){

            // 手动触发 自动计时器延时
            self.lockHide = true;
            clearTimeout(self.lockHideTimer);
            self.lockHideTimer = setTimeout(function(){
                self.lockHide = false;
            },5000);

            self.showController();
        } else if(!self.getActiveVideoElement()[0].paused) {
            self.hideController();
        }
    }

    private hideController(){

        var self = this;
        var element = self.playerElement.controller.root;

        if(!self.getActiveVideoElement()[0].paused) {
            element
                .removeClass('fadeInUp fadeOutDown animated')
                .addClass('fadeOutDown animated')
                .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){

                });
        }
    }

    private showController(){

        var self = this;
        var element = self.playerElement.controller.root;

        if(element.hasClass('fadeOutDown')){
            element
                .removeClass('fadeInUp fadeOutDown animated')
                .addClass('fadeInUp animated')
                .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){

                });
        }
    }

    /**
     * 载入下一个分段
     */
    private preloadNextPart(i) {

        i = parseInt(i);

        if ((i + 1) < this.videoPartLength) {
            this.videoElement.eq(i + 1).attr('preload', 'auto');
        }

    }

    /**
     * 播放下一个分段
     */
    private playNextPart(i) {

        i = parseInt(i);

        this.videoElement.eq(i)[0].pause();

        if ((i + 1) < this.videoPartLength) {
            this.videoElement.eq(i + 1)[0].currentTime = 0;
            this.videoElement.eq(i + 1)[0].play();
            this.currentPart = i + 1;
        } else {
            this.pause();
            this.playerElement.controller.play.find('.controller-icon').removeClass('controller-icon-play controller-icon-pause').addClass('controller-icon-play');
            this.setPosition(0);
        }

    }

    /**
     * 将秒转换为xx:xx格式
     */
    private formatSecond(s) {
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
     * 显示提示信息
     * @returns {*}
     */
    private showTooltip(msg) {

        var element = this.playerElement.toolTip;

        element
            .text(msg)
            .css('left', (window.innerWidth - element.width()) / 2)
            .stop(true, true)
            .fadeIn(200)
            .delay(3000)
            .fadeOut(200);

        return msg;

    }

    /**
     * 获取active元素
     */
    public getActiveVideoElement() {

        var element = this.videoElement.filter('.active');

        if (element) {
            return element;
        } else if (this.videoElement) {
            this.videoElement.eq(0).addClass('.active');
            return this.videoElement.eq(0);
        } else {
            console.error('没有被激活的元素');
            return {};
        }

    }

    /**
     * 暂停，暂停当前的播放
     * @return boolean this.status.paused
     */
    public pause() {
        this.videoElement.each(function () {
            this.pause();
        });

        this.shizuku.danmaku.stopTimer();
    }

    /**
     * 开始播放
     * @return boolean this.status.paused
     */
    public play() {
        this.getActiveVideoElement()[0].play();
        this.shizuku.danmaku.startTimer();
    }

    /**
     * 切换暂停
     * @return paused {boolean} 是否暂停
     */
    public togglePause() {

        var element = this.getActiveVideoElement()[0];

        if (element.paused) {
            this.play();
        } else {
            this.pause();
        }

        return element.paused;

    }

    /**
     * 跳转到指定位置
     * @param secOffset int 毫秒偏差
     */
    public setPosition(secOffset:number) {

        // 寻找part
        for (var i in this.videoPart) {

            if (secOffset < this.videoPart[i]) {

                this.currentTime = secOffset;
                this.currentPart = i;

                this.videoElement.removeClass('active');

                var activeElement = this.videoElement.eq(i);
                activeElement.addClass('active');
                activeElement[0].currentTime = secOffset;

                this.videoElement.each(function () {
                    if (!$(this).hasClass('active')) {
                        this.pause();
                    }
                });

                break;
            } else {
                secOffset = secOffset - this.videoPart[i];
            }


        }


    }


}