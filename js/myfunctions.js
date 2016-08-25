/**
 * Created by czc1000 on 2016/8/15.
 */

function ComAB(a,b) {

    return (a > b);

}


$.fn.DragElement = function(options) {

    var dragEntity = {
        selector:"li",       //拖放元素选择器，一般默认li即可
        $dragList:null,      //拖动元素外层DIV
        $dragElement:null,   //拖动元素
        $dropElements:null,  //放下元素的DIV集合
        direction:"vertical",      //元素排列方向 [vertical:只判断垂直, horizontal:只判断水平, all:都判断,
                                   // vertical-cross:垂直，可跨栏目移动
                                   // all-cross:都判断，可跨栏目移动]
        startX:0,            //鼠标点击初始X值
        startY:0,            //鼠标点击初始Y值
        offsetX:0,           //鼠标坐标与元素的偏移
        offsetY:0,           //鼠标坐标与元素的偏移
        isActive:false,      //是否拖放进行中
        $blankElement:false,  //元素的占位副本
        oldX:0,              //上一次移动的X
        oldY:0,              //上一次移动的Y  根据拖动的方向(上下左右)，给出合适的移动方法
        handle:'',            //手柄选择器，默认为空

        isCopyMode:'',        //移到另一个栏目时，是否以复制的形式（不删除源）
        copySrcDivId:''      //当 isCopyMode = true 时，为源 divID
    };

    dragEntity = $.extend(dragEntity, options);
    dragEntity.$dragList = $(this);

    //每组拖放DIV初始化一个随机ID
    dragEntity.$dragList.each(function(){
        $(this).data("dragDivId","dragDiv_" + Math.ceil(Math.random() * 1000));
    })

    /*
     * 方法名称：isRECTIntersect
     * 实现功能：判断两个矩形是否相交
     * 参数说明：
     *          rect1:要比较的第一组 RECT ,  格式：
     *          {
     *             x1,  //第一点坐标X
     *             y2,  //第一点坐标Y
     *             x2,  //第二点坐标X
     *             x2,  //第二点坐标Y
     *          };
     *
     *          * 约定，x2 > x1 且 y2 > y1
     *
     *          rect2:要比较的第二组 RECT , 格式与 rect1 相同;
     *          direction: [vertical:只判断垂直，元素每行一个的情况, horizontal:只判断水平, all：都判断]
     *
     *
     *
     *
     */
    function isRECTIntersect(rect1,rect2,direction){
        if ("vertical" == direction){
            //垂直 判断是否相交，任意一点在对方内部即可 (仅判断Y部分)
            if ((rect1.y1 >= rect2.y1 && rect1.y1 <= rect2.y2) ||
                (rect1.y2 >= rect2.y1 && rect1.y2 <= rect2.y2)
            ){
                return true;
            }else{
                return false;
            }
        }else if ("horizontal" == direction){
            //水平 判断是否相交，任意一点在对方内部即可 (仅判断X部分)
            if ((rect1.x1 >= rect2.x1 && rect1.x1 <= rect2.x2) ||
                (rect1.x2 >= rect2.x1 && rect1.x2 <= rect2.x2)
            ){
                return true;
            }else{
                return false;
            }
        }else{
            return isRECTIntersect(rect1,rect2,"vertical") && isRECTIntersect(rect1,rect2,"horizontal");
        }
        return false;
    }

    dragEntity.$dragList.on("mousedown",dragEntity.selector + " " + dragEntity.handle, function(e){


        if ("" != dragEntity.handle){
            dragEntity.$dragElement = $(this).parent();  //当前欲拖动的元素
        }else{
            dragEntity.$dragElement = $(this);  //当前欲拖动的元素
        }


        //复制模式
        if (dragEntity.isCopyMode){
            if (dragEntity.copySrcDivId == dragEntity.$dragElement.parent().attr("id")){
                var $tmpElement = dragEntity.$dragElement;
                dragEntity.$dragElement = dragEntity.$dragElement.clone();
                $tmpElement.before(dragEntity.$dragElement);
            }
        }

        dragEntity.$dropElements = dragEntity.$dragList.find(dragEntity.selector);  //当前组所有能拖动的元素

        //保存原有属性
        dragEntity.$dragElement.data("position",dragEntity.$dragElement.css("position"));
        dragEntity.$dragElement.data("z-index",dragEntity.$dragElement.css("z-index"));

        //给所有拖动元素一个标识
        dragEntity.$dragList.find(dragEntity.selector).each(function(){
            $(this).data("dragItemId","dragItem_" + Math.ceil(Math.random() * 1000));
        })

        //占位副本
        dragEntity.$blankElement = dragEntity.$dragElement.clone();
        dragEntity.$blankElement.addClass("blank-element");

        //非复制模式，立即出现占位副本
        if (!dragEntity.isCopyMode){
            dragEntity.$dragElement.after(dragEntity.$blankElement);
        }

        var offset = dragEntity.$dragElement.offset();
        dragEntity.offsetX = offset.left; //获取元素与鼠标坐标的相对位置
        dragEntity.offsetY = offset.top;  //获取元素与鼠标坐标的相对位置

        dragEntity.startX = e.pageX - dragEntity.offsetX; //获取元素与鼠标坐标的相对位置
        dragEntity.startY = e.pageY - dragEntity.offsetY;
        dragEntity.isActive = true;
        dragEntity.$dragElement.css({"position":"absolute","z-index":"9999"});

        event.preventDefault();
    });

    $(document).on("mousemove",function(e){

        //var debugStr = "";

        if (dragEntity.isActive){
            var toX = e.pageX - dragEntity.startX;// 移动到鼠标坐标位置（- 相对位置偏移）
            var toY = e.pageY - dragEntity.startY;//

            dragEntity.$dragElement.css({"left":toX + "px","top":toY + "px"});

            //获取移动对象的 RECT (x1,y1,x2,y2)
            var offset = dragEntity.$dragElement.offset();
            var RECT = {
                x1:offset.left,
                y1:offset.top,
                x2:offset.left + dragEntity.$dragElement.width(),
                y2:offset.top + dragEntity.$dragElement.height()
            }

            //如果有把手，缩小碰撞尺寸，减少同时跨多栏目的情况
            if (dragEntity.handle){
                RECT.x2 = RECT.x1 + 30;
                RECT.y2 = RECT.y1 + 30;
            }



            //debugStr += "当前拖动："  + Math.ceil(RECT.x1) + "," + Math.ceil(RECT.x2) + "," + Math.ceil(RECT.y1) + "," + Math.ceil(RECT.y2) + "<br />";

            var $currentDropElement = null;
            var minTop = 9999;//最小top
            var moveVDirection = "down";
            var moveHDirection = "right";

            if (e.pageY > dragEntity.oldY){
                moveVDirection = "down";
            }else if (e.pageY < dragEntity.oldY){
                moveVDirection = "up";
            }else{
                moveVDirection = "none";
            }

            if (e.pageX > dragEntity.oldX){
                moveHDirection = "right";
            }else if (e.pageX < dragEntity.oldX){
                moveHDirection = "left";
            }else{
                moveHDirection = "none";
            }

            dragEntity.oldX = e.pageX;
            dragEntity.oldY = e.pageY;


            //循环判断是否相交
            dragEntity.$dropElements.each(function(i){
                if (null == $currentDropElement){
                    var $this = $(this);
                    var dropOffset = $this.offset();
                    //获取drop对象的 RECT (x1,y1,x2,y2)
                    var dropRECT = {
                        x1:dropOffset.left,
                        y1:dropOffset.top,
                        x2:dropOffset.left + $this.width() + parseInt($this.css("padding-left")) + parseInt($this.css("padding-right")),
                        y2:dropOffset.top + $this.height() + parseInt($this.css("padding-top")) + parseInt($this.css("padding-bottom"))
                    };

                    //debugStr += "<br />" + $this.text() + "："  + Math.ceil(dropRECT.y1) + "," + Math.ceil(dropRECT.y2);
                    if (minTop > dropRECT.y1){
                        minTop = dropRECT.y1;
                    }

                    if ($this.data("dragItemId") == dragEntity.$dragElement.data("dragItemId")){
                        //元素为自身，不作处理
                    }else{
                        if (isRECTIntersect(RECT,dropRECT,dragEntity.direction)){
                            $currentDropElement = $this;
                            //debugStr += "当前碰撞："  + Math.ceil(dropRECT.x1) + "," + Math.ceil(dropRECT.x2)   + ","+ Math.ceil(dropRECT.y1) + "," + Math.ceil(dropRECT.y2) + "<br />";
                        }else{
                            //debugStr += ""  + Math.ceil(dropRECT.x1) + "," + Math.ceil(dropRECT.x2)  + ","+ Math.ceil(dropRECT.y1) + "," + Math.ceil(dropRECT.y2) + "<br />";
                        }
                    }
                }
            })


            //复制模式，若拖动元素在自身栏目中，则不作任何操作
            if (dragEntity.isCopyMode){
                if (null != $currentDropElement && dragEntity.copySrcDivId == $currentDropElement.parent().attr("id")){
                    return false;
                }
            }


            //找到相交，拟移动至相应处
            if ($currentDropElement){
                switch(dragEntity.direction){
                    case "vertical":
                    case "vertical-cross":
                        //垂直判断
                        if ("down" == moveVDirection){
                            $currentDropElement.after(dragEntity.$blankElement);
                        }else if ("up" == moveVDirection){
                            $currentDropElement.before(dragEntity.$blankElement);
                        }
                        break;
                    case "horizontal":
                    case "horizontal-cross":
                        //水平判断
                        if ("right" == moveHDirection){
                            $currentDropElement.after(dragEntity.$blankElement);
                        }else if ("left" == moveHDirection) {
                            $currentDropElement.before(dragEntity.$blankElement);
                        }
                        break;
                    case "all":
                    case "all-cross":
                        //全部判断, 按次序优先判断，为了操作体验
                        //根据移动方向，决定在前面或后面插入
                        if ("right" == moveHDirection){
                            $currentDropElement.after(dragEntity.$blankElement);
                        }else if ("left" == moveHDirection){
                            $currentDropElement.before(dragEntity.$blankElement);
                        }else if ("down" == moveVDirection){
                            $currentDropElement.after(dragEntity.$blankElement);
                        }else if ("up" == moveVDirection){
                            $currentDropElement.before(dragEntity.$blankElement);
                        }
                        break;
                }

            }


            //当跨DIV时,若上面未成功判断相交，则直接移动到所在DIV
            if (null == $currentDropElement) {
                switch(dragEntity.direction){
                    case "vertical-cross":
                    case "all-cross":
                        dragEntity.$dragList.each(function (i) {
                            var $this = $(this);
                            var divOffset = $this.offset();
                            var divRECT = {
                                x1: divOffset.left,
                                y1: divOffset.top,
                                x2: divOffset.left + $this.width(),
                                y2: divOffset.top + $this.height()
                            };

                            if (!dragEntity.isCopyMode || dragEntity.copySrcDivId != $this.attr("id")){ //非复制模式下
                                if (isRECTIntersect(RECT,divRECT,dragEntity.direction)){
                                    //若欲移动的并非这个DIV，则移动到这个DIV
                                    if (!($this.data("dragDivId") == dragEntity.$blankElement.parent().data("dragDivId"))){
                                        $this.append(dragEntity.$blankElement);
                                    }

                                }
                            }
                        })
                        break;
                }
            }


            //$("#debug").html(debugStr);
        }
    });

    $(document).on("mouseup",function(e){
        if (dragEntity.isActive){
            dragEntity.isActive = false;
            dragEntity.$dragElement.css({"left":"auto","top":"auto"});


            dragEntity.$blankElement.after(dragEntity.$dragElement);
            dragEntity.$blankElement.remove();

            //恢复原有属性
            dragEntity.$dragElement.css("position",dragEntity.$dragElement.data("position"));
            dragEntity.$dragElement.css("z-index",dragEntity.$dragElement.data("z-index"));

            //复制模式下，若最终无移动，删之
            if (dragEntity.isCopyMode && dragEntity.copySrcDivId == dragEntity.$dragElement.parent().attr("id")) {
                dragEntity.$dragElement.remove();
            }
        }
    });

};
