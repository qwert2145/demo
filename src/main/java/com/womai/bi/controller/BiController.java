package com.womai.bi.controller;

import com.alibaba.fastjson.JSON;
import com.womai.bi.model.*;
import com.womai.bi.service.BiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.*;

/**
 * Created by wlb on 2016/2/17.
 */
@Controller
public class BiController {

    @Autowired
    private BiService biService;

    @RequestMapping(value = "/getCompareData",method = RequestMethod.GET,produces = "application/json; charset=utf-8")
    @ResponseBody
    public String getCompareData() {
        Map<String, Map> map = new HashMap<String, Map>();
        map.put("weekly", biService.getGaiKuang("weekly"));
        map.put("monthly", biService.getGaiKuang("monthly"));
        map.put("beforeYesterday", biService.getGaiKuang("beforeyesterday"));
        map.put("yesterday",biService.getGaiKuang("yesterday"));
        return JSON.toJSONString(map);
    }

    @RequestMapping(value = "/getLastTwoWeek",method = RequestMethod.GET,produces = "application/json; charset=utf-8")
    @ResponseBody
    public String getLastTwoWeek() {
        long endTime = new Date().getTime() - 1*60*60*24*1000;
        Date endDay = new Date(endTime);
        long beginTime = new Date().getTime() - 14*60*60*24*1000;
        Date beginDay = new Date(beginTime);
        SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd");
        List<Map<String,Object>> list = biService.getLastTwoWeek(df.format(beginDay), df.format(endDay));
        //ordercnt legendData
        List<String> orderLegend = new ArrayList<String>();
        orderLegend.add("订单量");
        //price legendData
        List<String> priceLegend = new ArrayList<String>();
        priceLegend.add("订单金额");
        //user legendData
        List<String> userLegend = new ArrayList<String>();
        userLegend.add("下单用户");
        //uv legendData
        List<String> uvLegend = new ArrayList<String>();
        uvLegend.add("UV");

        //ordercnt series
        List<Series> orderSeries = new ArrayList<Series>();
        List<Object> orderDatas = new ArrayList<Object>();

        //price series
        List<Series> priceSeries = new ArrayList<Series>();
        List<Object> priceDatas = new ArrayList<Object>();
        //user series
        List<Series> userSeries = new ArrayList<Series>();
        List<Object> userDatas = new ArrayList<Object>();
        //uv series
        List<Series> uvSeries = new ArrayList<Series>();
        List<Object> uvDatas = new ArrayList<Object>();

        //xaxis data
        SimpleDateFormat sdf = new SimpleDateFormat("M/d");
        List<String> xAxisDatas = new ArrayList<String>();

        for(Map<String,Object> map :list){
            Date riqi =(Date) map.get("riqi");
            //add
            xAxisDatas.add(sdf.format(riqi));
            orderDatas.add(map.get("ordercnt"));
            priceDatas.add(map.get("orderprice"));
            userDatas.add(map.get("usercnt"));
            uvDatas.add(map.get("uv"));
        }
        orderSeries.add(generateSeries("订单量", orderDatas));
        DataModel orderModel = generateDataModel(orderLegend, xAxisDatas, orderSeries);

        priceSeries.add(generateSeries("订单金额", priceDatas));
        DataModel priceModel = generateDataModel(priceLegend, xAxisDatas, priceSeries);

        userSeries.add(generateSeries("下单用户", userDatas));
        DataModel userModel = generateDataModel(userLegend, xAxisDatas, userSeries);

        uvSeries.add(generateSeries("UV", uvDatas));
        DataModel uvModel = generateDataModel(uvLegend, xAxisDatas, uvSeries);

        Map<String, DataModel> map = new HashMap<String, DataModel>();
        map.put("ordercnt", orderModel);
        map.put("orderprice", priceModel);
        map.put("usercnt", userModel);
        map.put("UV", uvModel);
        return JSON.toJSONString(map);
    }
    //shishi
    @RequestMapping(value = "/getSumToday",method = RequestMethod.GET,produces = "application/json; charset=utf-8")
    @ResponseBody
    public String getSumToday() {
        Calendar calendar = Calendar.getInstance();
        int hour = calendar.get(Calendar.HOUR_OF_DAY);
        List<String> hours = new ArrayList<String>();
        StringBuffer sb = new StringBuffer();
        for(int i=0;i<=hour;i++){
            if(i<10){
                hours.add("0" + i);
            }else{
                hours.add(i + "");
            }
        }
        return JSON.toJSONString(biService.getSumToday(hours));
    }

    @RequestMapping(value = "/getShiShiChart",method = RequestMethod.GET,produces = "application/json; charset=utf-8")
    @ResponseBody
    public String getShiShiChart() {
        Calendar calendar = Calendar.getInstance();
        int hour = calendar.get(Calendar.HOUR_OF_DAY);
        //before the current hour
        List<String> beforeHours = new ArrayList<String>();
        for(int i=0;i<=hour;i++){
            if(i<10){
                beforeHours.add("0" + i);
            }else{
                beforeHours.add(i + "");
            }
        }

        //today every hour data
        List<Map<String,Object>> todayHourList = biService.getEveryHourToday(beforeHours);
        //seven days every hour data
        List<Map<String,Object>> beforeHourList= biService.getAverageOfSevenDays(beforeHours);

        //ordercnt legendData
        List<String> orderLegend = new ArrayList<String>();
        orderLegend.add("订单量");
        orderLegend.add("7日平均");
        //orderprice legendData
        List<String> priceLegend = new ArrayList<String>();
        priceLegend.add("订单金额");
        priceLegend.add("7日平均");
        //user legendData
        List<String> userLegend = new ArrayList<String>();
        userLegend.add("下单用户");
        userLegend.add("7日平均");
        //uv legendData
        List<String> uvLegend = new ArrayList<String>();
        uvLegend.add("UV");
        uvLegend.add("7日平均");
        //ordercnt series
        List<Series> orderSeries = new ArrayList<Series>();
        //price series
        List<Series> priceSeries = new ArrayList<Series>();
        //user series
        List<Series> userSeries = new ArrayList<Series>();
        //uv series
        List<Series> uvSeries = new ArrayList<Series>();

        //every hour of today
        List<Object> orderTodayData = new ArrayList<Object>();
        //7 days data
        List<Object> orderSevenData = new ArrayList<Object>();

        //every hour of today
        List<Object> priceTodayData = new ArrayList<Object>();
        //7 days data
        List<Object> priceSevenData = new ArrayList<Object>();

        //every hour of today
        List<Object> userTodayData = new ArrayList<Object>();
        //7 days data
        List<Object> userSevenData = new ArrayList<Object>();

        //every hour of today
        List<Object> uvTodayData = new ArrayList<Object>();
        //7 days data
        List<Object> uvSevenData = new ArrayList<Object>();

        //xaxis data
        List<String> xAxisDatas = new ArrayList<String>();

        //every hour data of today
        for(Map<String,Object> map : todayHourList){
            orderTodayData.add(map.get("ordercnt"));
            priceTodayData.add(map.get("orderprice"));
            userTodayData.add(map.get("usercnt"));
            uvTodayData.add(map.get("uv"));
        }

        //7 days data
        DecimalFormat decimalFormat = new DecimalFormat("######0.00");//转换成整型
        for(Map<String,Object> map :beforeHourList){
            xAxisDatas.add((String)map.get("hours"));
            //除以7
            BigDecimal divider = new BigDecimal("7");
            BigDecimal orderCnt = (BigDecimal)map.get("ordercnt");
            BigDecimal orderCntAverage = orderCnt.divide(divider, 2, RoundingMode.HALF_UP);
            orderSevenData.add(orderCntAverage);

            //uv/user/price  除以7
            priceSevenData.add(decimalFormat.format((Double) map.get("orderprice") / 7));

            BigDecimal userCnt = (BigDecimal)map.get("usercnt");
            BigDecimal userCntAverage = userCnt.divide(divider, 2, RoundingMode.HALF_UP);

            BigDecimal uv = (BigDecimal)map.get("uv");
            BigDecimal uvAverage = uv.divide(divider, 2, RoundingMode.HALF_UP);

            userSevenData.add(userCntAverage);
            uvSevenData.add(uvAverage);

        }

        //today data
        orderSeries.add(generateSeries("订单量", orderTodayData));
        //7 days data
        orderSeries.add(generateSeries("7日平均", orderSevenData));

        //uv/user/price
        priceSeries.add(generateSeries("订单金额",priceTodayData));
        priceSeries.add(generateSeries("7日平均",priceSevenData));
        userSeries.add(generateSeries("下单用户", userTodayData));
        userSeries.add(generateSeries("7日平均",userSevenData));
        uvSeries.add(generateSeries("UV", uvTodayData));
        uvSeries.add(generateSeries("7日平均", uvSevenData));

        DataModel orderModel = generateDataModel(orderLegend, xAxisDatas, orderSeries);
        //uv/user/price
        DataModel priceModel = generateDataModel(priceLegend, xAxisDatas, priceSeries);
        DataModel userModel = generateDataModel(userLegend, xAxisDatas, userSeries);
        DataModel uvModel = generateDataModel(uvLegend, xAxisDatas, uvSeries);

        Map<String, DataModel> map = new HashMap<String, DataModel>();
        map.put("ordercnt", orderModel);
        //uv/user/price
        map.put("orderprice", priceModel);
        map.put("usercnt", userModel);
        map.put("UV", uvModel);
        return JSON.toJSONString(map);

    }

    //quyu
    @RequestMapping(value = "/getQuYuTable",method = RequestMethod.GET,produces = "application/json; charset=utf-8")
    @ResponseBody
    public String getQuYuTable(String begin,String end) {
//        if(begin.equals(end)){
//            begin = begin + " 00:00:00";
//            end = end + " 23:59:59";
//        }
        begin = begin + " 00:00:00";
        end = end + " 23:59:59";
        Map<String,Object> all = biService.getAll(begin,end);
        Map<String, Object> huabei = biService.getRegion(begin, end, 0);
        Map<String, Object> huadong = biService.getRegion(begin, end, 100);
        Map<String, Object> huanan = biService.getRegion(begin, end, 200);
        Map<String, Object> huazhong = biService.getRegion(begin, end, 500);
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("all", all);
        map.put("huabei", huabei);
        map.put("huadong", huadong);
        map.put("huanan", huanan);
        map.put("huazhong", huazhong);

        return JSON.toJSONString(map);
    }

    @RequestMapping(value = "/getQuYuChart",method = RequestMethod.GET,produces = "application/json; charset=utf-8")
    @ResponseBody
    public String getQuYuChart(String begin,String end,int region) {
        List<Map<String,Object>> list = biService.getQuYuChart(begin,end,region);
        //ordercnt legendData
        List<String> orderLegend = new ArrayList<String>();
        orderLegend.add("订单量");
        //price legendData
        List<String> priceLegend = new ArrayList<String>();
        priceLegend.add("订单金额");
        //user legendData
        List<String> userLegend = new ArrayList<String>();
        userLegend.add("下单用户");

        //ordercnt series
        List<Series> orderSeries = new ArrayList<Series>();
        List<Object> orderDatas = new ArrayList<Object>();

        //price series
        List<Series> priceSeries = new ArrayList<Series>();
        List<Object> priceDatas = new ArrayList<Object>();
        //user series
        List<Series> userSeries = new ArrayList<Series>();
        List<Object> userDatas = new ArrayList<Object>();

        //xaxis data
        SimpleDateFormat sdf = new SimpleDateFormat("M/d");
        List<String> xAxisDatas = new ArrayList<String>();

        for(Map<String,Object> map :list){
            Date riqi =(Date) map.get("riqi");
            //add
            xAxisDatas.add(sdf.format(riqi));
            orderDatas.add(map.get("ordercnt"));
            priceDatas.add(map.get("orderprice"));
            userDatas.add(map.get("usercnt"));
        }
        orderSeries.add(generateSeries("订单量", orderDatas));
        DataModel orderModel = generateDataModel(orderLegend, xAxisDatas, orderSeries);

        priceSeries.add(generateSeries("订单金额", priceDatas));
        DataModel priceModel = generateDataModel(priceLegend, xAxisDatas, priceSeries);

        userSeries.add(generateSeries("下单用户", userDatas));
        DataModel userModel = generateDataModel(userLegend, xAxisDatas, userSeries);

        Map<String, DataModel> map = new HashMap<String, DataModel>();
        map.put("ordercnt", orderModel);
        map.put("orderprice", priceModel);
        map.put("usercnt", userModel);
        return JSON.toJSONString(map);
    }
    //platform
    @RequestMapping(value = "/getPlatformTable",method = RequestMethod.GET,produces = "application/json; charset=utf-8")
    @ResponseBody
    public String getPlatformTable(String begin,String end) {
//        if(begin.equals(end)){
//            begin = begin + " 00:00:00";
//            end = end + " 23:59:59";
//        }
        begin = begin + " 00:00:00";
        end = end + " 23:59:59";
        Map<String,Object> all = biService.getAll(begin,end);
        Map<String, Object> pc = biService.getPlatform(begin, end, "pc");
        Map<String, Object> mobile = biService.getPlatform(begin, end, "mobile");
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("all", all);
        map.put("pc", pc);
        map.put("mobile", mobile);
        return JSON.toJSONString(map);
    }

    @RequestMapping(value = "/getPlatformChart",method = RequestMethod.GET,produces = "application/json; charset=utf-8")
    @ResponseBody
    public String getPlatformChart(String begin,String end) {
        List<Map<String,Object>> pcChart = biService.getPcChart(begin, end);
        List<Map<String,Object>> mobileChart = biService.getMobileChart(begin, end);

        //legendData
        List<String> legend = new ArrayList<String>();
        legend.add("pc");
        legend.add("移动");
        //ordercnt series
        List<Series> orderSeries = new ArrayList<Series>();
        //price series
        List<Series> priceSeries = new ArrayList<Series>();
        //user series
        List<Series> userSeries = new ArrayList<Series>();
        //uv series
        List<Series> uvSeries = new ArrayList<Series>();

        //pc
        List<Object> orderPcData = new ArrayList<Object>();
        //mobile
        List<Object> orderMobileData = new ArrayList<Object>();

        //pc
        List<Object> pricePcData = new ArrayList<Object>();
        //mobile
        List<Object> priceMobileData = new ArrayList<Object>();

        //pc
        List<Object> userPcData = new ArrayList<Object>();
        //mobile
        List<Object> userMobileData = new ArrayList<Object>();

        //pc
        List<Object> uvPcData = new ArrayList<Object>();
        //mobile
        List<Object> uvMobileData = new ArrayList<Object>();

        //xaxis data
        List<String> xAxisDatas = new ArrayList<String>();
        SimpleDateFormat sdf = new SimpleDateFormat("M/d");

        //pc
        for(Map<String,Object> map : pcChart){
            orderPcData.add(map.get("ordercnt"));
            pricePcData.add(map.get("orderprice"));
            userPcData.add(map.get("usercnt"));
            uvPcData.add(map.get("uv"));
        }

        //mobile data
        for(Map<String,Object> map : mobileChart){
            Date riqi =(Date) map.get("riqi");
            //add
            xAxisDatas.add(sdf.format(riqi));
            orderMobileData.add(map.get("ordercnt"));
            priceMobileData.add(map.get("orderprice"));
            userMobileData.add(map.get("usercnt"));
            uvMobileData.add(map.get("uv")==null?0:map.get("uv"));
        }

        //pc data
        orderSeries.add(generateSeries("pc", orderPcData));
        //mobile data
        orderSeries.add(generateSeries("移动", orderMobileData));

        //uv/user/price
        priceSeries.add(generateSeries("pc",pricePcData));
        priceSeries.add(generateSeries("移动",priceMobileData));
        userSeries.add(generateSeries("pc", userPcData));
        userSeries.add(generateSeries("移动",userMobileData));
        uvSeries.add(generateSeries("pc", uvPcData));
        uvSeries.add(generateSeries("移动", uvMobileData));

        DataModel orderModel = generateDataModel(legend, xAxisDatas, orderSeries);
        //uv/user/price
        DataModel priceModel = generateDataModel(legend, xAxisDatas, priceSeries);
        DataModel userModel = generateDataModel(legend, xAxisDatas, userSeries);
        DataModel uvModel = generateDataModel(legend, xAxisDatas, uvSeries);

        Map<String, DataModel> map = new HashMap<String, DataModel>();
        map.put("ordercnt", orderModel);
        //uv/user/price
        map.put("orderprice", priceModel);
        map.put("usercnt", userModel);
        map.put("UV", uvModel);
        return JSON.toJSONString(map);
    }
    //ordertype
    @RequestMapping(value = "/getOrderTypeTable",method = RequestMethod.GET,produces = "application/json; charset=utf-8")
    @ResponseBody
    public String getOrderTypeTable(String begin,String end) {
        List<Map<String,Object>> list = biService.getTypeTable(begin, end);
        return JSON.toJSONString(list);
    }
    @RequestMapping(value = "/getOrderTypeChart",method = RequestMethod.GET,produces = "application/json; charset=utf-8")
    @ResponseBody
    public String getOrderTypeChart(String begin,String end,String flag) {
        List<Map<String,Object>> list = biService.getTypeChart(begin, end, flag);
        //ordercnt legendData
        List<String> orderLegend = new ArrayList<String>();
        orderLegend.add("订单量");
        //price legendData
        List<String> priceLegend = new ArrayList<String>();
        priceLegend.add("订单金额");
        //user legendData
        List<String> userLegend = new ArrayList<String>();
        userLegend.add("下单用户");

        //ordercnt series
        List<Series> orderSeries = new ArrayList<Series>();
        List<Object> orderDatas = new ArrayList<Object>();

        //price series
        List<Series> priceSeries = new ArrayList<Series>();
        List<Object> priceDatas = new ArrayList<Object>();
        //user series
        List<Series> userSeries = new ArrayList<Series>();
        List<Object> userDatas = new ArrayList<Object>();

        //xaxis data
        SimpleDateFormat sdf = new SimpleDateFormat("M/d");
        List<String> xAxisDatas = new ArrayList<String>();

        for(Map<String,Object> map :list){
            Date riqi =(Date) map.get("riqi");
            //add
            xAxisDatas.add(sdf.format(riqi));
            orderDatas.add(map.get("ordercnt"));
            priceDatas.add(map.get("orderprice"));
            userDatas.add(map.get("usercnt"));
        }
        orderSeries.add(generateSeries("订单量", orderDatas));
        DataModel orderModel = generateDataModel(orderLegend, xAxisDatas, orderSeries);

        priceSeries.add(generateSeries("订单金额", priceDatas));
        DataModel priceModel = generateDataModel(priceLegend, xAxisDatas, priceSeries);

        userSeries.add(generateSeries("下单用户", userDatas));
        DataModel userModel = generateDataModel(userLegend, xAxisDatas, userSeries);

        Map<String, DataModel> map = new HashMap<String, DataModel>();
        map.put("ordercnt", orderModel);
        map.put("orderprice", priceModel);
        map.put("usercnt", userModel);
        return JSON.toJSONString(map);
    }

    //huiyuan
    @RequestMapping(value = "/getHuiYuanTable",method = RequestMethod.GET,produces = "application/json; charset=utf-8")
    @ResponseBody
    public String getHuiYuanTable(String begin,String end) {
//        if(begin.equals(end)){
//            begin = begin + " 00:00:00";
//            end = end + " 23:59:59";
//        }

        begin = begin + " 00:00:00";
        end = end + " 23:59:59";
        Map<String,Object> all = biService.getAllUser(begin,end);
        Map<String, Object> newUser = biService.getNewUser(begin, end);
        Map<String, Object> oldUser = biService.getOldUser(begin, end);
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("all", all);
        map.put("newUser", newUser);
        map.put("oldUser", oldUser);
        return JSON.toJSONString(map);
    }
    @RequestMapping(value = "/getHuiYuanChart",method = RequestMethod.GET,produces = "application/json; charset=utf-8")
    @ResponseBody
    public String getHuiYuanChart(String begin,String end) {
        List<Map<String, Object>> list = biService.getHuiYuanChart(begin, end);

        //legendData
        List<String> legend = new ArrayList<String>();
        legend.add("新会员");
        legend.add("老会员");
        //ordercnt series
        List<Series> orderSeries = new ArrayList<Series>();
        //price series
        List<Series> priceSeries = new ArrayList<Series>();
        //user series
        List<Series> userSeries = new ArrayList<Series>();

        //new user
        List<Object> orderNewData = new ArrayList<Object>();
        //old user
        List<Object> orderOldData = new ArrayList<Object>();

        //new user
        List<Object> priceNewData = new ArrayList<Object>();
        //old user
        List<Object> priceOldData = new ArrayList<Object>();

        //new user
        List<Object> userNewData = new ArrayList<Object>();
        //old user
        List<Object> userOldData = new ArrayList<Object>();

        //xaxis data
        List<String> xAxisDatas = new ArrayList<String>();
        SimpleDateFormat sdf = new SimpleDateFormat("M/d");

        //
        for(Map<String,Object> map : list){
            Date riqi =(Date) map.get("riqi");
            //add
            xAxisDatas.add(sdf.format(riqi));
            orderNewData.add(map.get("newuserordercnt"));
            priceNewData.add(map.get("newuserorderprice"));
            userNewData.add(map.get("newusercnt"));

            orderOldData.add(map.get("olduserordercnt"));
            priceOldData.add(map.get("olduserorderprice"));
            userOldData.add(map.get("oldusercnt"));
        }

        //new User data
        orderSeries.add(generateSeries("新会员", orderNewData));
        //old user data
        orderSeries.add(generateSeries("老会员", orderOldData));

        //uv/user/price
        priceSeries.add(generateSeries("新会员",priceNewData));
        priceSeries.add(generateSeries("老会员",priceOldData));
        userSeries.add(generateSeries("新会员", userNewData));
        userSeries.add(generateSeries("老会员",userOldData));


        DataModel orderModel = generateDataModel(legend, xAxisDatas, orderSeries);
        //uv/user/price
        DataModel priceModel = generateDataModel(legend, xAxisDatas, priceSeries);
        DataModel userModel = generateDataModel(legend, xAxisDatas, userSeries);

        Map<String, DataModel> map = new HashMap<String, DataModel>();
        map.put("ordercnt", orderModel);
        //uv/user/price
        map.put("orderprice", priceModel);
        map.put("usercnt", userModel);
        return JSON.toJSONString(map);
    }

    private DataModel generateDataModel(List<String> legendDatas,List<String> xAxisDatas,List<Series> seriesList){
        DataModel dataModel = new DataModel();

        Map<String, List<String>> legend = new HashMap<String, List<String>>();
        List<String> legendData = new ArrayList<String>();
        legendData.addAll(legendDatas);
        legend.put("data", legendData);
        dataModel.setLegend(legend);

        Grid grid = new Grid();
        dataModel.setGrid(grid);

        List<XAxis> xAxisList = new ArrayList<XAxis>();
        XAxis xAxis = new XAxis();
        List<String> xAxisData = new ArrayList<String>();

        xAxisData.addAll(xAxisDatas);
        xAxis.setData(xAxisData);
        xAxisList.add(xAxis);
        dataModel.setXAxis(xAxisList);

        dataModel.setSeries(seriesList);

        List<YAxis> yAxises = new ArrayList<YAxis>();
        YAxis yAxis = new YAxis();
        yAxises.add(yAxis);
        dataModel.setYAxis(yAxises);

        return dataModel;
    }
    private Series generateSeries(String seriesName,List<Object> seriesDatas){
        Series series = new Series();
        series.setName(seriesName);
        List<Object> seriesData = new ArrayList<Object>();
        seriesData.addAll(seriesDatas);
        series.setData(seriesData);
        return series;
    }

}
