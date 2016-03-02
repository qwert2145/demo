package com.womai.bi.dao;

import com.womai.bi.dao.util.SimpleDao;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
public class BiDao {
	private static final Logger LOGGER = LoggerFactory.getLogger(BiDao.class);
	@Autowired
	private SimpleDao simpleDao;

	//gaikuang
	@Autowired
	private String sql_getGaiKuang;

	@Autowired
	private String sql_getLastTwoWeek;

	public Map<String, Object> getGaiKuang(String flag) {
		Map<String, Object> paramMap = new HashMap<String, Object>();
		paramMap.put("flag", flag);
		List<Map<String, Object>> result = simpleDao.getNamedParameterJdbcTemplate().queryForList(sql_getGaiKuang,
				paramMap);
		if(result.size() == 0) {
			return new HashMap<String, Object>();
		}
		return result.get(0);
	}


	public List<Map<String, Object>> getLastTwoWeek(String begin,String end) {
		return getList(begin, end, sql_getLastTwoWeek);
	}

	//shishi
	@Autowired
	private String sql_sumToday;

	public Map<String, Object> getSumToday(List<String> hours) {
		Map<String, Object> paramMap = new HashMap<String, Object>();
		paramMap.put("hours", hours);
		List<Map<String, Object>> result = simpleDao.getNamedParameterJdbcTemplate().queryForList(sql_sumToday,
				paramMap);
		if(result.size() == 0) {
			return new HashMap<String, Object>();
		}
		return result.get(0);
	}

	@Autowired
	private String sql_getEveryHourToday;

	public List<Map<String, Object>> getEveryHourToday(List<String> hours) {
		Map<String, Object> paramMap = new HashMap<String, Object>();
		paramMap.put("hours", hours);

		return simpleDao.getNamedParameterJdbcTemplate().queryForList(sql_getEveryHourToday,
				paramMap);
	}
	@Autowired
	private String sql_getAverageOfSevenDays;

	public List<Map<String, Object>> getAverageOfSevenDays(List<String> hours) {
		Map<String, Object> paramMap = new HashMap<String, Object>();
		paramMap.put("hours", hours);

		return simpleDao.getNamedParameterJdbcTemplate().queryForList(sql_getAverageOfSevenDays,
				paramMap);
	}

	//quyu
	@Autowired
	private String sql_getAll;
	@Autowired
	private String sql_getAllForChuKu;
	@Autowired
	private String sql_getRegion;
	@Autowired
	private String sql_getRegionForChuKu;

	public Map<String, Object> getAll(String begin,String end) {
		return getMap(begin,end,sql_getAll,sql_getAllForChuKu);
	}
	public Map<String, Object> getRegion(String begin,String end,int region) {
		Map<String, Object> paramMap = new HashMap<String, Object>();
		paramMap.put("begin", begin);
		paramMap.put("end", end);
		paramMap.put("region",region);
		return getMapByParamMap(paramMap, sql_getRegion, sql_getRegionForChuKu);
	}

	@Autowired
	private String sql_getQuYuChart;

	public List<Map<String, Object>> getQuYuChart(String begin,String end,int region) {
		Map<String, Object> paramMap = new HashMap<String, Object>();
		paramMap.put("begin", begin);
		paramMap.put("end", end);
		paramMap.put("region", region);
		return simpleDao.getNamedParameterJdbcTemplate().queryForList(sql_getQuYuChart,
				paramMap);
	}
	//platform
	@Autowired
	private String sql_getAllPlat;
	@Autowired
	private String sql_getAllPlatForChuKu;
	@Autowired
	private String sql_getPlatform;
	@Autowired
	private String sql_getPlatformForChuKu;

	public Map<String, Object> getAllPlat(String begin,String end) {
		return getMap(begin,end,sql_getAllPlat,sql_getAllPlatForChuKu);
	}
	public Map<String, Object> getPlatform(String begin,String end,String platform) {
		Map<String, Object> paramMap = new HashMap<String, Object>();
		paramMap.put("begin", begin);
		paramMap.put("end", end);
		paramMap.put("platform",platform);
		return getMapByParamMap(paramMap, sql_getPlatform, sql_getPlatformForChuKu);
	}


	@Autowired
	private String sql_getPcChart;

	public List<Map<String, Object>> getPcChart(String begin,String end) {
		return getList(begin, end, sql_getPcChart);
	}

	@Autowired
	private String sql_getMobileChart;

	public List<Map<String, Object>> getMobileChart(String begin,String end) {
		return getList(begin, end, sql_getMobileChart);
	}

	//ordertype
	@Autowired
	private String sql_getTypeTable;
	public List<Map<String, Object>> getTypeTable(String begin,String end) {
		return getList(begin, end, sql_getTypeTable);
	}

	@Autowired
	private String sql_getTypeChart;
	public List<Map<String, Object>> getTypeChart(String begin,String end,String flag) {
		Map<String, Object> paramMap = new HashMap<String, Object>();
		paramMap.put("begin", begin);
		paramMap.put("end", end);
		paramMap.put("flag", flag);
		return simpleDao.getNamedParameterJdbcTemplate().queryForList(sql_getTypeChart,
				paramMap);
	}
	//huiyuan
	@Autowired
	private String sql_getAllUser;
	@Autowired
	private String sql_getAllUserForChuku;
	public Map<String, Object> getAllUser(String begin,String end) {
		return getMap(begin, end, sql_getAllUser, sql_getAllUserForChuku);
	}
	@Autowired
	private String sql_getNewUser;
	@Autowired
	private String sql_getNewUserForChuku;
	public Map<String, Object> getNewUser(String begin,String end) {
		return getMap(begin,end,sql_getNewUser,sql_getNewUserForChuku);
	}
	@Autowired
	private String sql_getOldUser;
	@Autowired
	private String sql_getOldUserForChuku;
	public Map<String, Object> getOldUser(String begin,String end) {
		return getMap(begin,end,sql_getOldUser,sql_getOldUserForChuku);
	}
	@Autowired
	private String sql_getHuiYuanChart;
	public List<Map<String, Object>> getHuiYuanChart(String begin,String end) {
		return getList(begin, end, sql_getHuiYuanChart);
	}
	private Map<String,Object> getMap(String begin,String end,String sql1,String sql2){
		Map<String, Object> paramMap = new HashMap<String, Object>();
		paramMap.put("begin", begin);
		paramMap.put("end", end);
		List<Map<String,Object>> result = simpleDao.getNamedParameterJdbcTemplate().queryForList(sql1,
				paramMap);
		List<Map<String,Object>> chukuResult = simpleDao.getNamedParameterJdbcTemplate().queryForList(sql2,
				paramMap);
		Map<String, Object> map = result.get(0);
		map.putAll(chukuResult.get(0));
		return map;
	}

	private List<Map<String,Object>> getList(String begin,String end,String sql){
		Map<String, Object> paramMap = new HashMap<String, Object>();
		paramMap.put("begin", begin);
		paramMap.put("end", end);
		return simpleDao.getNamedParameterJdbcTemplate().queryForList(sql,
				paramMap);
	}

	private Map<String,Object> getMapByParamMap(Map<String, Object> paramMap,String sql1,String sql2){
		List<Map<String,Object>> result = simpleDao.getNamedParameterJdbcTemplate().queryForList(sql1,
				paramMap);
		List<Map<String,Object>> chukuResult = simpleDao.getNamedParameterJdbcTemplate().queryForList(sql2,
				paramMap);
		Map<String, Object> map = result.get(0);
		map.putAll(chukuResult.get(0));
		return map;
	}
}
