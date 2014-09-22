interface HTMLElement {
    width:any;
    height:any;
    w:any;
    h:any;
    mode:any;
    ttl:any;
    dur:any;
    play():void;
    pause():void;
    requestFullscreen():boolean;
    mozRequestFullScreen():boolean;
    webkitRequestFullscreen():boolean;
}

interface MSStyleCSSProperties {
    webkitTransformOrigin:any;
    OTransformOrigin:any;
    MozTransformOrigin:any;
    MSTransformOrigin:any;
    webkitTransform:any;
    OTransform:any;
    MozTransform:any;
    MSTransform:any;
}

interface Document {
    fullscreenEnabled:boolean;
    mozFullscreenElement:boolean;
    webkitFullscreenElement:boolean;
    exitFullscreen():boolean;
    mozCancelFullScreen():boolean;
    webkitExitFullscreen():boolean;
    expando:boolean;
}

declare var CommentManager: {
    new(stage:HTMLElement): CommentManagerMethod;
};

declare var CommentFilter: {
    new(): any;
};

interface CommentManagerMethod {
    load(CommentData:any):boolean;
    start():boolean;
    stop():boolean;
    insert(CommentData :any):boolean;
    send(CommentData :any):boolean;
    clear():boolean;
    time(time:number):boolean;
    setFilter(CommentFilter: any):boolean;
    getFilter():any;
}

declare var AcfunParser:any;