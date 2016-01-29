package com.womai.bi.dao.util;

import com.womai.bi.util.VelocityUtil;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.lang.WordUtils;

import java.io.IOException;
import java.util.Calendar;
import java.util.Date;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 常用SQL处理工具类
 * 
 * @author wlb
 * 
 */
public final class SqlUtil {

	private SqlUtil() {
	}

	/**
	 * 将带下划线的数据库列名转化成大小写混合的Java类参数名
	 * 
	 * @param fieldName
	 *            带下划线的数据库列名
	 * @return 大小写混合的Java类参数名
	 */
	public static String fieldNameToProperName(String fieldName) {
		String properName = WordUtils.capitalizeFully(fieldName.toLowerCase(),
				new char[] { '_' }).replaceAll("_", "");

		return properName.substring(0, 1).toLowerCase()
				+ properName.substring(1);
	}

	/**
	 * 将大小写混合的Java类参数名转化成带下划线的数据库列名
	 * 
	 * @param properName
	 *            大小写混合的Java类参数名
	 * @return 带下划线的数据库列名
	 */
	public static String properNameToFieldName(String properName) {
		String[] parts = StringUtils.splitByCharacterTypeCamelCase(properName);

		StringBuilder fieldNameBuilder = new StringBuilder();
		for (String part : parts) {
			fieldNameBuilder.append(part.toLowerCase()).append("_");
		}

		return fieldNameBuilder.toString().substring(0,
				fieldNameBuilder.length() - 1);
	}

	/**
	 * 取得当前服务器时间，格式 yyyy-mm-dd
	 * 
	 * @return 当天
	 */
	public static Date getToday() {
		return new Date(Calendar.getInstance().getTimeInMillis());
	}

	/**
	 * 取得当前服务器时间，格式 yyyy-mm-dd hh:mm:ss
	 * 
	 * @return 当前时间
	 */
	public static Date getNow() {
		return new Date(Calendar.getInstance().getTimeInMillis());
	}

	/**
	 * 利用Velocity模板技术进行动态SQL生成，部分模拟mybatis的功能
	 * 
	 * @param SqlTemplateContent
	 *            原始sql velocity 模板
	 * @param model
	 *            变量Map
	 * @return 经过转化后的SQL，用于SimpleDao进行直接调用
	 */
	public static String renderSqlTemplate(String SqlTemplateContent,
			Map<String, ?> model) throws IOException {
		return VelocityUtil.renderTemplateContent(SqlTemplateContent, model);
	}

	/**
	 * 根据实际查询SQL，生成简单的统计总数的sql
	 * 
	 * @param sql
	 * @return 统计总数的sql
	 */
	public static String prepareCountSql(String sql) {
		String countSql = "SELECT count(0) " + removeSelect(removeOrders(sql));
		return countSql;
	}

	/**
	 * 从SQL语句中简单的移除select from字符串，不能处理过于复杂的情况
	 * 
	 * @param sql
	 * @return
	 */
	private static String removeSelect(String sql) {
		int beginPos = sql.toLowerCase().indexOf("from");
		return sql.substring(beginPos);
	}

	/**
	 * 从SQL语句中删除order语句，不能处理过于复杂的情况
	 * 
	 * @param sql
	 * @return
	 */
	private static String removeOrders(String sql) {
		Pattern p = Pattern.compile("order\\s*by[\\w|\\W|\\s|\\S]*",
				Pattern.CASE_INSENSITIVE);
		Matcher m = p.matcher(sql);
		StringBuffer sb = new StringBuffer();
		while (m.find()) {
			m.appendReplacement(sb, "");
		}
		m.appendTail(sb);
		return sb.toString();
	}
}