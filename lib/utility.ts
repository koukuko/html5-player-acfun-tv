//
// AcFun Html5 Player
// 模块: 实用工具
//
// @author koukuko<9@acfun.tv>
//

module _ {

    /**
     * 读取hash值并转换为Object对象返回
     * @param hash {string} location.hash
     * @returns {Object} 转换后的对象
     */
    export function readHash(hash:string){

        var result = {};

        if(!hash) var hash = '#';
        var params = hash.substr(1).split(';');


        for(var i=0 ; i< params.length;i++){
            var param = params[i].split('=');
            result[param[0]] = param[1];
        }

        return result;
    }


    /**
     * 无脑ParseJSON
     * @str {string} 待解析字符串
     */
    export function parseJSON(str){
        try {
            return JSON.parse(str);
        } catch (e){
            return null;
        }
    }

    /**
     * 全屏切换
     * @param {HTMLElement} element DOM元素
     * @return {boolean} 当前全屏状态
     */
    export function toggleFullScreen(element:HTMLElement) {
        var enableFullScreen =
            document.fullscreenEnabled
            || document.mozFullscreenElement
            || document.webkitFullscreenElement;

        if (enableFullScreen) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        } else {
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
        }

        return document.fullscreenEnabled
            || document.mozFullscreenElement
            || document.webkitFullscreenElement;

    }


}

$.fn.extend({

    anim:function(x,cb?){

        $(this).addClass(x + ' animated').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
            $(this).removeClass(x + ' animated');
            if(cb){cb();}
        });
    }
});