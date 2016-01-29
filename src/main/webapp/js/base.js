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
                    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
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
    //初始化   总体概览
    init('t0');

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
        var json={};
        var option={
            legend: {
                data: []
            }
        };
        if( t=='t0' ){//总体概况
            option.legend.data=['订单量','对比'];
        }else if( t=='t1' ){//实时

        }else if( t=='t2' ){//

        }else if( t=='t5' ){//新老会员

            option.legend.data=['新会员','老会员'];
        }

        $(".panel section").empty();
        $(".panel section").html(template( t,json) );
        var myChart = echarts.init(document.querySelector('.echart'));
        console.log( getOption(option) );
        myChart.setOption( getOption(option) );

        //tab 切换
        var i=10;
        $('.panel-tab a').live('click',function(){
            $('.panel-tab a').removeClass('on');
            $(this).addClass('on');
            i+=100;
            option.series[0].data[0]=i;
            myChart.setOption( option );
            return false;
        });
    }

})(window,document,$,echarts);
