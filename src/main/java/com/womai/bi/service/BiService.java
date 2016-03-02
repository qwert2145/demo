package com.womai.bi.service;

import com.womai.bi.dao.BiDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Created by wlb on 2016/1/28.
 */
@Service
@Transactional
public class BiService {

    @Autowired
    private BiDao biDao;
    //gaikuang
    public Map<String, Object> getGaiKuang(String flag) {
        return biDao.getGaiKuang(flag);
    }

//    public Map<String, Object> getBeforeYesterday(String riqi) {
//        return biDao.getBeforeYesterday(riqi);
//    }

    public List<Map<String, Object>> getLastTwoWeek(String begin,String end) {
        return biDao.getLastTwoWeek(begin, end);
    }
    //shishi
    public Map<String, Object> getSumToday(List<String> hours) {
        return biDao.getSumToday(hours);
    }

    public List<Map<String, Object>> getEveryHourToday(List<String> hours) {
        return biDao.getEveryHourToday(hours);
    }

//    public List<Map<String, Object>> getAverageOfSixDays(List<String> hours) {
//        return biDao.getAverageOfSixDays(hours);
//    }


    public List<Map<String, Object>> getAverageOfSevenDays(List<String> hours) {
        return biDao.getAverageOfSevenDays(hours);
    }
    //quyu

    public Map<String, Object> getAll(String begin,String end) {
        return biDao.getAll(begin, end);
    }
    public Map<String, Object> getRegion(String begin,String end,int region) {
        return biDao.getRegion(begin, end, region);
    }
    public List<Map<String, Object>> getQuYuChart(String begin,String end,int region) {
        return biDao.getQuYuChart(begin, end, region);
    }

    //platform
    public Map<String, Object> getAllPlat(String begin,String end) {
        return biDao.getAllPlat(begin, end);
    }
    public Map<String, Object> getPlatform(String begin,String end,String platform) {
        return biDao.getPlatform(begin, end, platform);
    }

    public List<Map<String, Object>> getPcChart(String begin,String end) {
        return biDao.getPcChart(begin, end);
    }
    public List<Map<String, Object>> getMobileChart(String begin,String end) {
        return biDao.getMobileChart(begin, end);
    }
    //ordertype
    public List<Map<String, Object>> getTypeTable(String begin,String end) {
        return biDao.getTypeTable(begin, end);
    }
    public List<Map<String, Object>> getTypeChart(String begin,String end,String flag) {
        return biDao.getTypeChart(begin, end, flag);
    }
    //huiyuan
    public Map<String, Object> getAllUser(String begin,String end) {
        return biDao.getAllUser(begin, end);

    }
    public Map<String, Object> getOldUser(String begin,String end) {
        return biDao.getOldUser(begin, end);
    }
    public Map<String, Object> getNewUser(String begin,String end) {
        return biDao.getNewUser(begin, end);
    }

    public List<Map<String, Object>> getHuiYuanChart(String begin,String end) {
        return biDao.getHuiYuanChart(begin, end);
    }
}
