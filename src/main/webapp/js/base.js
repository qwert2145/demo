+(function(window,document,$,echarts,template,$zfb){

    var slideout = new Slideout({
        'panel': document.getElementById('panel'),
        'menu': document.getElementById('menu'),
        'side': 'left',
        'padding':120
    });

    document.querySelector('.panel-header a').addEventListener('click', function() {
        slideout.toggle();
    });

    $(".panel section").css({'min-height': window.innerHeight-61 || window.screen.height-61  });

    //初始化   总体概览
    $(function(){
        init('t0');
        $ajax('isAdmin',{},function(json){

            if(json==1){

            }else{
                $('[controller="reg"]').remove();
            }
        });
    });

    // menu切换
    //$(".s-notice").html(template("notice", json.data));
    $('.menu-section').click(function(){
        $('.menu-section').removeClass('on');
        $(this).addClass('on');
        var controller=$(this).attr("controller");
        if( controller ){
            init( controller );
        }else{
            var i=$('.menu-section').index(this);
            init('t'+i);
        }
        slideout.close();
        return false;
    });

    function init(t){
        init[t]();
    }
    init.t0=function(){//总体概况
        $('.panel-header h1').text('总体概况');
        $(".panel section").html( template( 't0',{} ) );

        $ajax('getCompareData',{},function(json){
            //转化率
            json.yesterday.conversion=json.yesterday.usercnt/json.yesterday.uv;
            json.beforeYesterday.conversion=json.beforeYesterday.usercnt/json.beforeYesterday.uv;
            json.weekly.conversion=json.weekly.usercnt/json.weekly.uv;
            json.monthly.conversion=json.monthly.usercnt/json.monthly.uv;
            //对比
            $('.p-all h3 a').live('click',function(){
                $('.p-all h3 a').removeClass('on');
                $(this).addClass('on');
                var bi=$(this).attr('k');
                json.yesterday.ordercntBi=(json.yesterday.ordercnt-json[bi].ordercnt)/json[bi].ordercnt*100;
                json.yesterday.orderPriceBi=(json.yesterday.orderprice-json[bi].orderprice)/json[bi].orderprice*100;
                json.yesterday.kedanjiaBi=(json.yesterday.kedanjia-json[bi].kedanjia)/json[bi].kedanjia*100;
                json.yesterday.uvBi=(json.yesterday.uv-json[bi].uv)/json[bi].uv*100;
                json.yesterday.usercntBi=(json.yesterday.usercnt-json[bi].usercnt)/json[bi].usercnt*100;
                json.yesterday.conversionBi=(json.yesterday.conversion-json[bi].conversion)/json[bi].conversion*100;
                $(".panel section .p-all .tb").remove();
                $(".panel section .p-all h3").after( template( 't0_tb',json ) );
                return false;
            });
            $('.p-all h3 a').click();

        });
        $ajax('getLastTwoWeek',{},function(json){
            //tab 切换
            $('.p-all .panel-tab a').live('click',function(){
                $(this).parent().find('a').removeClass('on');
                $(this).addClass('on');
                var myChart = echarts.init(document.querySelector('.echart'));
                myChart.setOption( getOption( json[$(this).attr("k")]) );
                return false;
            });
            $('.p-all .panel-tab a').click();
        });
    };
    init.t1=function() {//实时
        $('.panel-header h1').text('实时');

        $ajax('getSumToday',{},function(json){

            $(".panel section").html(template( 't1',json) );



            $ajax('getShiShiChart',{},function(json){
                //tab 切换
                $('.p-real .panel-tab a').live('click',function(){
                    $(this).parent().find('a').removeClass('on');
                    $(this).addClass('on');
                    var myChart = echarts.init(document.querySelector('.echart'));
                    myChart.setOption( getOption(json[$(this).attr("k")]) );
                    return false;
                });
                $('.p-real .panel-tab a').click();
            });

        });
    }
    init.t2=function() {//区域
        $('.panel-header h1').text('区域');
        $(".panel section").html(template('t2',{}));


        $('#start,#end').live('change',function(){
            getQuYuTable( $('#start').val(),$('#end').val() );
            getQuYuChart( $('#start').val(),$('#end').val() );
        });
        var start=new Date().addDays(-7).format("yyyy-MM-dd");
        var end=new Date().addDays(-1).format("yyyy-MM-dd");
        $('#start').val(start);
        $('#end').val( end );
        getQuYuTable(start,end);
        getQuYuChart(start,end);
        function getQuYuTable(start,end){
            $ajax('getQuYuTable?begin='+ start +'&end='+end,{},function(json) {
                $(".panel section .p-area .tb").remove();
                $(".panel section .p-area h3").after(template('t2-tb', json));
            });

        }
        function getQuYuChart(start,end){
            $ajax('getQuYuChart?begin='+ start +'&end='+end+'&region='+ $('.p-area .panel-tab-mid a.on').attr('k') ,{},function(json) {
                var myChart = echarts.init(document.querySelector('.echart'));
                myChart.setOption( getOption(json[$('.p-area .tab a.on').attr("k")]) );
            });
        }
        //tab 切换
        $('.p-area .panel-tab-mid a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            getQuYuChart( $('#start').val(),$('#end').val() );
            return false;
        });
        $('.p-area .tab a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            getQuYuChart( $('#start').val(),$('#end').val() );
            return false;
        });
    }
    init.t3=function() {//客户端
        $('.panel-header h1').text('客户端');
        $(".panel section").html(template( 't3',{}) );

        $('#start,#end').live('change',function(){
            getTable( $('#start').val(),$('#end').val() );
            getChart( $('#start').val(),$('#end').val() );
        });
        var start=new Date().addDays(-7).format("yyyy-MM-dd");
        var end=new Date().addDays(-1).format("yyyy-MM-dd");
        $('#start').val(start);
        $('#end').val( end );
        getTable(start,end);
        getChart(start,end);
        function getTable(start,end){
            $ajax('getPlatformTable?begin='+ start +'&end='+end,{},function(json) {
                $(".panel section .p-client .tb").remove();
                $(".panel section .p-client h3").after(template('t3-tb', json));
            });

        }
        function getChart(start,end){
            $ajax('getPlatformChart?begin='+ start +'&end='+end+'&region=-1',{},function(json) {
                var myChart = echarts.init(document.querySelector('.echart'));
                myChart.setOption( getOption(json[$('.p-client .tab a.on').attr("k")]) );
            });
        }
        //tab 切换
        $('.p-client .tab a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            getChart( $('#start').val(),$('#end').val() );
            return false;
        });
    }
    init.t4=function(option) {//订单类别
        $('.panel-header h1').text('订单类别');
        $(".panel section").html(template( 't4',{}) );

        $('#start,#end').live('change',function(){
            getTable( $('#start').val(),$('#end').val() );
            getChart( $('#start').val(),$('#end').val() );
        });
        var start=new Date().addDays(-7).format("yyyy-MM-dd");
        var end=new Date().addDays(-1).format("yyyy-MM-dd");
        $('#start').val(start);
        $('#end').val( end );
        getTable(start,end);
        getChart(start,end);
        function getTable(start,end){
            $ajax('getOrderTypeTable?begin='+ start +'&end='+end,{},function(json) {
                $(".panel section .p-order .tb").remove();
                $(".panel section .p-order h3").after(template('t4-tb',{data:json}));
            });
        }
        function getChart(start,end){
            $ajax('getOrderTypeChart?begin='+ start +'&end='+end+'&flag='+ $('.tab1 a.on').attr('k') ,{},function(json) {
                var myChart = echarts.init(document.querySelector('.echart'));
                myChart.setOption( getOption(json[$('.tab2 a.on').attr("k")]) );
            });
        }
        //tab 切换
        $('.p-order .tab1 a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            getChart( $('#start').val(),$('#end').val() );
            return false;
        });
        $('.p-order .tab2 a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            getChart( $('#start').val(),$('#end').val() );
            return false;
        });
    }
    init.t5=function(option){//新老会员
        $('.panel-header h1').text('新老会员');
        $(".panel section").html(template( 't5',{}) );

        $('#start,#end').live('change',function(){
            getTable( $('#start').val(),$('#end').val() );
            getChart( $('#start').val(),$('#end').val() );
        });
        var start=new Date().addDays(-7).format("yyyy-MM-dd");
        var end=new Date().addDays(-1).format("yyyy-MM-dd");
        $('#start').val(start);
        $('#end').val( end );
        getTable(start,end);
        getChart(start,end);
        function getTable(start,end){
            $ajax('getHuiYuanTable?begin='+ start +'&end='+end,{},function(json) {
                $(".panel section .p-user .tb").remove();
                $(".panel section .p-user h3").after(template('t5-tb',json));
            });
        }
        function getChart(start,end){
            $ajax('getHuiYuanChart?begin='+ start +'&end='+end+'&flag=all' ,{},function(json) {
                var myChart = echarts.init(document.querySelector('.echart'));
                myChart.setOption( getOption(json[$('.tab2 a.on').attr("k")]) );
            });
        }
        //tab 切换
        $('.p-user .tab1 a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            getChart( $('#start').val(),$('#end').val() );
            return false;
        });
        $('.p-user .tab2 a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            getChart( $('#start').val(),$('#end').val() );
            return false;
        });

    };
    //创建用户，authority为user是普通用户，为admin是超级用户，返回1，创建成功，返回0，用户已存在
    //http://127.0.0.1/createUser?userName=username&passWord=password&authority=user

    //修改密码:
    //http://127.0.0.1/changePass?userName=username&passWord=password
    init.reg=function(){//
        $('.panel-header h1').text('创建用户');
        var json={};
        $(".panel section").html(template( 'reg',json) );

        $('#reg .bt').live('click',function(){

            var res=$zfb('#reg',{
                username:{required:'请输入用户名.',username:'用户名包括6到20位的数字和字符.'},
                pwd:{required:'请输入密码.',username:'密码包括6到20位的数字和字符.'},
                pwd2:{required:'请输入确认密码.',username:'密码包括6到20位的数字和字符.',equal:['pwd','两次输入的密码不一致.']}
            },{username:/^\w{6,20}$/}).result;
            if(res){
                $ajax('createUser?userName='+ $('[name="username"]').val() +'&passWord='+ $('[name="pwd"]').val() +'&authority=user',{},function(json){

                    if(json==1){
                        $('.for-result').text('创建成功');
                    }else if(json==0){
                        $('.for-result').text('用户已存在');
                    }else{
                        $('.for-result').text('出错啦,请重试.');
                    }
                    setTimeout(function(){
                        $('.for-result').text('');
                    },1000);
                });
            }
            return false;
        });


    };
    init.updatePwd=function(){//
        $('.panel-header h1').text('修改密码');
        var json={};
        $(".panel section").html(template( 'updatePwd',json) );
        $('#upd .bt').live('click',function(){

            var res=$zfb('#upd',{
                username:{required:'请输入用户名.',username:'用户名包括6到20位的数字和字符.'},
                pwd:{required:'请输入密码.',username:'密码包括6到20位的数字和字符.'},
                pwd2:{required:'请输入确认密码.',username:'密码包括6到20位的数字和字符.',equal:['pwd','两次输入的密码不一致.']}
            },{username:/^\w{6,20}$/}).result;
            if(res){
                $ajax('changePass?userName='+ $('[name="username"]').val() +'&passWord='+ $('[name="pwd"]').val() ,{},function(json){

                    if(json==1){
                        $('.for-result').text('修改成功');
                    }else if(json==0){
                        $('.for-result').text('修改失败');
                    }else{
                        $('.for-result').text('修改失败');
                    }
                    setTimeout(function(){
                        $('.for-result').text('');
                    },1000);
                });
            }
            return false;
        });
    };
    init.out=function(){

        $ajax('j_spring_security_logout',{},function(){
            window.location='login';
        });

    };

    function getOption(opt) {
        if(opt) {
            opt.grid={
                bottom: "5%",
                containLabel: true,
                left: "1%",
                right: "1%"
            };
            opt.tooltip = {
                trigger: 'item',
                formatter: '{a} : {c}'
            };
            opt.xAxis[0].axisLabel={interval:0,rotate:45,textStyle:{color:'#333'}};
            var data;
            if( opt.xAxis[0] && opt.xAxis[0].data.length>0 ){
                data=opt.xAxis[0].data;
                var index=Math.round(data.length/3);
                for(var i=0;i<data.length-1;i++) {
                    if( i%index!=0 ){
                        data[i]='';
                    }
                }
            }
            if( opt.xAxis[1] && opt.xAxis[1].data.length>0 ){
                data=opt.xAxis[1].data;
                var index=Math.round(data.length/3);
                for(var i=0;i<data.length-1;i++) {
                    if( i%index!=0 ){
                        data[i]='';
                    }
                }
            }
        }
        //console.log( '::::::' );
        //console.log( opt );
        return opt;
    }
    function $ajax(url,para,fn){
        console.log( '请求地址:'+ url );
        $.getJSON( url, para, function(data) {
            console.log( data );
            fn( data );
        });

    }
    template.helper('numFormat', function ( num,size ) {
            if (isNaN(num) || !num || !isFinite(num) ) {
                num = 0;
            }else if( parseFloat(num)>9999 ) {
                num = (parseFloat(num) / 10000).toFixed(size || 2) + '万';
            }else if( isPositiveNum(num) || num==0 ){
                return num;
            } else {
                num = parseFloat(num).toFixed(size || 2);
            }
        return num;

    });
// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
// 例子：
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
    Date.prototype.format = function(fmt)
    { //author: meizz
        var o = {
            "M+" : this.getMonth()+1,                 //月份
            "d+" : this.getDate(),                    //日
            "h+" : this.getHours(),                   //小时
            "m+" : this.getMinutes(),                 //分
            "s+" : this.getSeconds(),                 //秒
            "q+" : Math.floor((this.getMonth()+3)/3), //季度
            "S"  : this.getMilliseconds()             //毫秒
        };
        if(/(y+)/.test(fmt))
            fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
        for(var k in o)
            if(new RegExp("("+ k +")").test(fmt))
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
        return fmt;
    }
    // 给日期类对象添加日期差方法，返回日期与diff参数日期的时间差，单位为天
    Date.prototype.diff = function(date){
        return (this.getTime() - date.getTime())/(24 * 60 * 60 * 1000);
    }
    Date.prototype.addDays = function(d)
    {
        this.setDate(this.getDate() + d);
        return this;
    };
    function isPositiveNum(s){//是否为正整数
        var re = /^[0-9]*[1-9][0-9]*$/ ;
        return re.test(s)
    }
})(window,document,$,echarts,template,$zfb);
