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


        for(var i in params){
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


}

$.fn.extend({

    anim:function(x,cb?){

        $(this).addClass(x + ' animated').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
            $(this).removeClass(x + ' animated');
            if(cb){cb();}
        });
    }
});