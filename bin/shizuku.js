//
// AcFun Html5 Player
// 模块: 配置 - 开发环境
//
// @author koukuko<9@acfun.tv>
//
var settings = {
    httpJiexiUrl: 'http://ssl.acfun.tv/shizuku/jiexi/index.php',
    danmakuUrl: 'http://ssl.acfun.tv/shizuku/danmaku',
    commentLifeTime: 7000
};
//
// AcFun Html5 Player
// 模块: 实用工具
//
// @author koukuko<9@acfun.tv>
//
var _;
(function (_) {
    /**
     * 读取hash值并转换为Object对象返回
     * @param hash {string} location.hash
     * @returns {Object} 转换后的对象
     */
    function readHash(hash) {
        var result = {};
        if (!hash)
            var hash = '#';
        var params = hash.substr(1).split(';');
        for (var i = 0; i < params.length; i++) {
            var param = params[i].split('=');
            result[param[0]] = param[1];
        }
        return result;
    }
    _.readHash = readHash;
    /**
     * 无脑ParseJSON
     * @str {string} 待解析字符串
     */
    function parseJSON(str) {
        try {
            return JSON.parse(str);
        }
        catch (e) {
            return null;
        }
    }
    _.parseJSON = parseJSON;
    /**
     * 全屏切换
     * @param {HTMLElement} element DOM元素
     * @return {boolean} 当前全屏状态
     */
    function toggleFullScreen(element) {
        var enableFullScreen = document.fullscreenEnabled || document.mozFullscreenElement || document.webkitFullscreenElement;
        if (enableFullScreen) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
            else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            }
            else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
        else {
            if (element.requestFullscreen) {
                element.requestFullscreen();
            }
            else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            }
            else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            }
            else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
        }
        return document.fullscreenEnabled || document.mozFullscreenElement || document.webkitFullscreenElement;
    }
    _.toggleFullScreen = toggleFullScreen;
})(_ || (_ = {}));
$.fn.extend({
    anim: function (x, cb) {
        $(this).addClass(x + ' animated').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
            $(this).removeClass(x + ' animated');
            if (cb) {
                cb();
            }
        });
    }
});
//
// AcFun Html5 Player
// 模块: 播放器模块
//
// @author koukuko <9@acfun.tv>
//
var player = (function () {
    function player() {
        this.videoPart = [];
        this.videoPartLength = 0;
        this.currentTime = 0;
        this.currentPart = 0;
        this.tryResume = 0;
        this.tryReConnect = 0;
        this.lockSeek = false;
        this.lockTouch = false;
        this.lockHide = false;
    }
    /**
     * 播放器父级控制器
     * @param shizuku
     */
    player.prototype.bind = function (shizuku) {
        this.shizuku = shizuku;
        this.playerElement = shizuku.playerElement;
    };
    /**
     * 终止播放器执行，销毁所有资源
     * @return boolean
     */
    player.prototype.destruct = function () {
        this.videoElement.remove();
    };
    /**
     * 载入视频
     * @param videoSrc mixed 源地址
     */
    player.prototype.load = function (videoSrc) {
        var self = this;
        this.videoSrc = videoSrc;
        // 优先使用高清画质
        this.nowVideoSrc = videoSrc['C20'] || videoSrc['C80'] || videoSrc['C70'] || videoSrc['C60'] || videoSrc['C50'] || videoSrc['C40'] || videoSrc['C30'] || videoSrc['C10'];
        // 告知长度
        this.playerElement.controller.line.total.text(this.formatSecond(this.nowVideoSrc.totalseconds));
        this.playerElement.controller.line.output.range.attr('max', this.nowVideoSrc.totalseconds);
        // 获取弹幕
        $.getJSON(settings.danmakuUrl + '/' + this.shizuku.hashOptions.vid + '-' + Math.floor(Math.floor(this.nowVideoSrc.totalseconds / 60) * 100)).then(function (data) {
            if (data) {
                var comment = [];
                comment = comment.concat(data[0], data[1], data[2]);
            }
            var result = AcfunParser(JSON.stringify(comment));
            self.shizuku.danmaku.load(result);
            self.prepare(self.nowVideoSrc);
        });
    };
    /**
     * 准备视频，初始化
     */
    player.prototype.prepare = function (nowVideoSrc) {
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
            $(c).on('play', function () {
                // 一旦一个视频开始播放，那么将其设定为active并暂停其他视频
                self.videoElement.removeClass('active');
                $(this).addClass('active');
                self.videoElement.each(function () {
                    if ($(this).data('part') != self.currentPart) {
                        $(this)[0].pause();
                    }
                });
            }).on('canplaythrough', function () {
                self.preloadNextPart($(this).data('part'));
            }).on('ended', function () {
                self.playNextPart($(this).data('part'));
            }).on('timeupdate', function () {
                var currentTime = 0;
                for (var j = 0; j <= self.currentPart; j++) {
                    if (self.currentPart == j) {
                        currentTime += Math.floor(this.currentTime);
                    }
                    else {
                        currentTime += self.videoPart[j];
                    }
                }
                self.currentTime = currentTime;
                self.playerElement.controller.line.now.text(self.formatSecond(self.currentTime));
                self.playerElement.controller.line.output.played.width((self.currentTime / self.nowVideoSrc.totalseconds) * 100 + '%');
                if (!self.lockSeek) {
                    self.playerElement.controller.line.output.range.val(self.currentTime);
                }
                if (self.playerElement.toolTip.hasClass('wait')) {
                    self.playerElement.toolTip.removeClass('wait').fadeOut(100);
                }
                self.shizuku.danmaku.time(self.currentTime * 1000);
            }).on('error', function () {
                // 发生错误，重新尝试播放
                if (!self.tryResume) {
                    if (self.getActiveVideoElement()[0].paused) {
                        self.showTooltip('播放视频发生错误:尝试重新播放');
                    }
                }
                else if (!self.tryReConnect) {
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
            }).on('waiting', function () {
                self.showTooltip('正在读取视频，请稍等片刻...', true);
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
            }
            else {
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
        self.playerElement.container.danmaku.on('dblclick', function () {
            _.toggleFullScreen(self.playerElement.root[0]);
        }).on('click', function () {
            var paused = self.getActiveVideoElement()[0].paused;
            var showed = self.playerElement.controller.root.hasClass('fadeInUp');
            if (paused) {
                self.playerElement.controller.play.click();
                if (!showed) {
                    self.toggleHideController();
                }
            }
            else {
                if (showed) {
                    self.playerElement.controller.play.click();
                }
                else {
                    self.toggleHideController();
                }
            }
        }).on('touchstart', function (e) {
            firstTouch = e.originalEvent.targetTouches[0];
            self.lockTouch = true;
        }).on('touchmove', function (e) {
            lastTouch = e.originalEvent.targetTouches[0];
            // 确定操作类型
            if (!typeTouch && firstTouch && lastTouch) {
                if (Math.abs(lastTouch.pageX - firstTouch.pageX) > 150) {
                    typeTouch = 'seek';
                }
                else if (Math.abs(lastTouch.pageY - firstTouch.pageY) > 150) {
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
                        valueTouch = 0;
                    }
                    else if (valueTouch > self.nowVideoSrc.totalseconds) {
                        valueTouch = self.nowVideoSrc.totalseconds;
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
        setInterval(function () {
            if (!(self.lockSeek || self.lockTouch || self.lockHide)) {
                self.hideController();
            }
        }, 5000);
        self.setBounds();
        $(window).on('resize', function () {
            self.setBounds();
        });
    };
    /**
     * 设置弹幕边界和滚动速度
     */
    player.prototype.setBounds = function () {
        settings.commentLifeTime = Math.floor(window.innerWidth * 7.14);
        this.shizuku.danmaku.setBounds();
    };
    /**
     * 隐藏控制栏
     */
    player.prototype.toggleHideController = function () {
        var self = this;
        var element = self.playerElement.controller.root;
        if (element.hasClass('fadeOutDown')) {
            // 手动触发 自动计时器延时
            self.lockHide = true;
            clearTimeout(self.lockHideTimer);
            self.lockHideTimer = setTimeout(function () {
                self.lockHide = false;
            }, 5000);
            self.showController();
        }
        else if (!self.getActiveVideoElement()[0].paused) {
            self.hideController();
        }
    };
    player.prototype.hideController = function () {
        var self = this;
        var element = self.playerElement.controller.root;
        if (!self.getActiveVideoElement()[0].paused) {
            element.removeClass('fadeInUp fadeOutDown animated').addClass('fadeOutDown animated').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
            });
        }
    };
    player.prototype.showController = function () {
        var self = this;
        var element = self.playerElement.controller.root;
        if (element.hasClass('fadeOutDown')) {
            element.removeClass('fadeInUp fadeOutDown animated').addClass('fadeInUp animated').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
            });
        }
    };
    /**
     * 载入下一个分段
     */
    player.prototype.preloadNextPart = function (i) {
        i = parseInt(i);
        if ((i + 1) < this.videoPartLength) {
            this.videoElement.eq(i + 1).attr('preload', 'auto');
        }
    };
    /**
     * 播放下一个分段
     */
    player.prototype.playNextPart = function (i) {
        i = parseInt(i);
        this.videoElement.eq(i)[0].pause();
        if ((i + 1) < this.videoPartLength) {
            this.videoElement.eq(i + 1)[0].currentTime = 0;
            this.videoElement.eq(i + 1)[0].play();
            this.currentPart = i + 1;
        }
        else {
            this.pause();
            this.playerElement.controller.play.find('.controller-icon').removeClass('controller-icon-play controller-icon-pause').addClass('controller-icon-play');
            this.setPosition(0);
        }
    };
    /**
     * 将秒转换为xx:xx格式
     */
    player.prototype.formatSecond = function (s) {
        var t = '00:00';
        if (s > -1) {
            var min = Math.floor(s / 60);
            var sec = Math.floor(s % 60);
            if (min < 10) {
                t = "0";
            }
            else {
                t = "";
            }
            t += min + ":";
            if (sec < 10) {
                t += "0";
            }
            t += sec;
        }
        return t;
    };
    /**
     * 显示提示信息
     * @returns {*}
     */
    player.prototype.showTooltip = function (msg, wait) {
        var element = this.playerElement.toolTip;
        if (wait) {
            element.addClass('wait').text(msg).css('left', (window.innerWidth - element.width()) / 2).stop(true, true).fadeIn(200);
        }
        else {
            element.removeClass('wait').text(msg).css('left', (window.innerWidth - element.width()) / 2).stop(true, true).fadeIn(200).delay(3000).fadeOut(200);
        }
        return msg;
    };
    /**
     * 获取active元素
     */
    player.prototype.getActiveVideoElement = function () {
        var element = this.videoElement.filter('.active');
        if (element) {
            return element;
        }
        else if (this.videoElement) {
            this.videoElement.eq(0).addClass('.active');
            return this.videoElement.eq(0);
        }
        else {
            console.error('没有被激活的元素');
            return {};
        }
    };
    /**
     * 暂停，暂停当前的播放
     * @return boolean this.status.paused
     */
    player.prototype.pause = function () {
        this.videoElement.each(function () {
            this.pause();
        });
        this.shizuku.danmaku.stopTimer();
    };
    /**
     * 开始播放
     * @return boolean this.status.paused
     */
    player.prototype.play = function () {
        this.getActiveVideoElement()[0].play();
        this.shizuku.danmaku.startTimer();
    };
    /**
     * 切换暂停
     * @return paused {boolean} 是否暂停
     */
    player.prototype.togglePause = function () {
        var element = this.getActiveVideoElement()[0];
        if (element.paused) {
            this.play();
        }
        else {
            this.pause();
        }
        return element.paused;
    };
    /**
     * 跳转到指定位置
     * @param secOffset int 毫秒偏差
     */
    player.prototype.setPosition = function (secOffset) {
        for (var i in this.videoPart) {
            if (secOffset < this.videoPart[i]) {
                var lastActiveElement = this.getActiveVideoElement()[0];
                this.currentTime = secOffset;
                this.currentPart = i;
                this.videoElement.removeClass('active');
                var activeElement = this.videoElement.eq(i);
                activeElement.addClass('active');
                activeElement[0].currentTime = secOffset;
                if (lastActiveElement.paused) {
                    activeElement[0].pause();
                }
                else {
                    activeElement[0].play();
                }
                this.videoElement.filter(':not(.active)').each(function () {
                    this.pause();
                });
                break;
            }
            else {
                secOffset = secOffset - this.videoPart[i];
            }
        }
    };
    return player;
})();
/**
 * AcFun Html5 Player
 *
 * @version 北山しずく 3.0.1
 * @author Akino Mizuho.Koukuko <9@acfun.tv>
 */
/// <reference path='jquery.d.ts'/>
/// <reference path='interface.d.ts'/>
/// <reference path='settings.prod.ts'/>
/// <reference path='utility.ts'/>
/// <reference path='player.ts'/>
var shizuku = (function () {
    function shizuku() {
        this.player = new player();
        var self = this;
        // 1. 绑定播放器动作
        self.bindPlayerElement();
        // 2. 通过hash获取参数
        self.hash = location.hash;
        self.hashOptions = _.readHash(self.hash);
        if (!self.hashOptions || !self.hashOptions.vid) {
            self.preloadError('#0 初始化失败', '参数错误');
        }
        // 3.载入弹幕
        self.danmakuElement = self.playerElement.container.danmaku;
        self.danmaku = new CommentManager(self.danmakuElement[0]);
        self.danmaku.init();
        // 3. 解析视频
        self.loadVideo();
    }
    /**
     * 0. 获取视频信息
     */
    shizuku.prototype.loadVideo = function () {
        var self = this;
        var vid = self.hashOptions.vid;
        $.getJSON(settings.httpJiexiUrl + '?type=html5&vid=' + vid).then(function (data) {
            if (data && typeof data == 'object' && data.success) {
                self.playerElement.preLoad.root.fadeOut();
                self.videoSrc = data.result;
                // JUMP
                // 至此开始进入player.ts 转交控制权
                if (self.videoSrc && (self.videoSrc['C10'] || self.videoSrc['C20'] || self.videoSrc['C30'] || self.videoSrc['C40'] || self.videoSrc['C50'])) {
                    self.player.load(self.videoSrc);
                }
                else {
                    self.preloadError('#4 视频解析失败:' + vid, '没有可用的视频源');
                }
            }
            else {
                if (data && typeof data == 'object') {
                    self.preloadError('#1 视频解析失败:' + vid, data.message);
                }
                else {
                    self.preloadError('#2 视频解析失败:' + vid, '未知原因');
                }
            }
        }).fail(function (error) {
            self.preloadError('#3 视频解析失败:' + vid, '网络通讯失败');
        });
    };
    /**
     * 1. 初始化播放器元素
     */
    shizuku.prototype.bindPlayerElement = function () {
        this.playerElement = {
            root: $('.player'),
            preLoad: {
                root: $('.preload'),
                icon: $('.preload .preload-icon'),
                version: $('.preload .preload-version'),
                hint: $('.preload .preload-hint')
            },
            container: {
                root: $('.container'),
                video: $('.container .container-video'),
                danmaku: $('.container .container-danmaku')
            },
            controller: {
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
            },
            toolTip: $('.toolTip')
        };
        this.player.bind(this);
    };
    /**
     * 初始化报错提示
     * @params message {string} 报错提示字符串
     */
    shizuku.prototype.preloadError = function (message, etc) {
        console.error(message, etc);
        this.playerElement.preLoad.icon.fadeOut();
        if (etc) {
            this.playerElement.preLoad.version.text(message);
            this.playerElement.preLoad.hint.text(etc);
        }
        else {
            this.playerElement.preLoad.hint.text(message);
        }
    };
    return shizuku;
})();
