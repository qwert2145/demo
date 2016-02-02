+(function(window,document,$,echarts){

    var slideout = new Slideout({
        'panel': document.getElementById('panel'),
        'menu': document.getElementById('menu'),
        'side': 'left',
        'padding':120
    });

    document.querySelector('.panel-header a').addEventListener('click', function() {
        slideout.toggle();
    });

    $(".panel section").css({'min-height':window.screen.height || window.innerHeight});

    //初始化   总体概览
    $(function(){
        init('t0');
    });

    // menu切换
    //$(".s-notice").html(template("notice", json.data));
    $('.menu-section').click(function(){
        $('.menu-section').removeClass('on');
        $(this).addClass('on');
        var i=$('.menu-section').index(this);

        init('t'+i);

        slideout.close();
        return false;
    });

    function init(t){
        var option=getOption();
        init[t](option);
    }
    init.t0=function(option){//总体概况
        $('.panel-header h1').text('总体概况');
        var json={};
        $(".panel section").html(template( 't0',json) );
        var myChart = echarts.init(document.querySelector('.echart'));
        myChart.setOption( option );

        //tab 切换
        var i=10;
        $('.p-all .panel-tab a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            i+=100;
            option.series[0].data[0]=i;
            myChart.setOption( option );
            return false;
        });
    };
    init.t1=function(option) {//实时
        $('.panel-header h1').text('实时');
        var json={};
        option.legend.data=['订单量','7日平均'];
        option.series[0].name='订单量';
        option.series[1].name='7日平均';
        $(".panel section").html(template( 't1',json) );
        var myChart = echarts.init(document.querySelector('.echart'));
        myChart.setOption( option );
        //tab 切换
        var i=10;
        $('.p-real .panel-tab a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            i+=100;
            option.series[0].data[0]=i;
            myChart.setOption( option );
            return false;
        });
    }
    init.t2=function(option) {//区域
        $('.panel-header h1').text('区域');
        var json={};
        option.legend.data=['订单量'];
        option.series[0].name='订单量';
        delete option.series[1];
        $(".panel section").html(template( 't2',json) );
        var myChart = echarts.init(document.querySelector('.echart'));
        myChart.setOption( option );
        //tab 切换
        var i=10;
        $('.p-area .panel-tab-mid a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            i+=100;
            option.series[0].data[0]=i;
            myChart.setOption( option );
            return false;
        });
        $('.p-area .tab a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            i+=100;
            option.series[0].data[0]=i;
            myChart.setOption( option );
            return false;
        });
    }
    init.t3=function(option) {//客户端
        $('.panel-header h1').text('客户端');
        var json={};
        option.legend.data=['pc','移动'];
        option.series[0].name='pc';
        option.series[1].name='移动';
        $(".panel section").html(template( 't3',json) );
        var myChart = echarts.init(document.querySelector('.echart'));
        myChart.setOption( option );
        //tab 切换
        var i=10;
        $('.p-client .panel-tab a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            i+=100;
            option.series[0].data[0]=i;
            myChart.setOption( option );
            return false;
        });
    }
    init.t4=function(option) {//订单类别
        $('.panel-header h1').text('订单类别');
        var json={};

        $(".panel section").html(template( 't4',json) );
        var myChart = echarts.init(document.querySelector('.echart'));
        myChart.setOption( option );
        //tab 切换
        var i=10;
        $('.p-order .tab1 a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            i+=100;
            option.series[0].data[0]=i;
            myChart.setOption( option );
            return false;
        });
        $('.p-order .tab2 a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            i+=100;
            option.series[0].data[0]=i;
            myChart.setOption( option );
            return false;
        });
    }
    init.t5=function(option){//新老会员
        $('.panel-header h1').text('新老会员');
        var json={};
        var option=getOption();
        option.legend.data=['新会员','老会员'];
        option.series[0].name='新会员';
        option.series[1].name='老会员';

        $(".panel section").html(template( 't5',json) );
        var myChart = echarts.init(document.querySelector('.echart'));
        myChart.setOption( option );
        //tab 切换
        var i=10;
        $('.p-order .tab1 a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            i+=100;
            option.series[0].data[0]=i;
            myChart.setOption( option );
            return false;
        });
        $('.p-order .tab2 a').live('click',function(){
            $(this).parent().find('a').removeClass('on');
            $(this).addClass('on');
            i+=100;
            option.series[0].data[0]=i;
            myChart.setOption( option );
            return false;
        });

    };







    function getOption(opt) {
        var option = {
            legend: {
                data: ['订单量', '对比']
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: [
                {
                    type: 'category',
                    boundaryGap: false,
                    data: ['1/1', '1/2', '1/3', '1/4', '1/5', '1/6', '1/7']
                }
            ],
            yAxis: [
                {
                    type: 'value'
                }
            ],
            series: [
                {
                    name: '订单量',
                    type: 'line',
                    data: [10, 132, 101, 134, 90, 230, 210]
                },
                {
                    name: '对比',
                    type: 'line',
                    data: [220, 182, 191, 234, 290, 330, 310]
                }
            ]
        };
        return $.extend(option,opt);
    }
})(window,document,$,echarts);
