package com.womai.bi.dao.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.jdbc.core.simple.SimpleJdbcInsert;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 用于简化MySQL数据库操作
 * 
 * @author wlb
 *
 */
@Repository
public class SimpleDao {

	private DataSource dataSource;

	private static Logger logger = LoggerFactory.getLogger(SimpleDao.class);

	@Autowired
	public void setDataSource(DataSource dataSource) {
		this.dataSource = dataSource;
	}

	/**
	 * 存储过程调用 样例：
	 * 
	 * SimpleJdbcCall jdbcCall =
	 * simpleDao.getSimpleJdbcCall().withProcedureName(procedureName);
	 * SqlParameterSource in = new
	 * MapSqlParameterSource().addValue(inparam,inparamValue); Map out =
	 * jdbcCall.execute(in);
	 * 
	 * @return
	 */
	public SimpleJdbcCall getSimpleJdbcCall() {
		return new SimpleJdbcCall(this.dataSource);
	}

	/**
	 * 简单的存储过程调用
	 * 
	 * @param procdureName
	 * @param in
	 * @return
	 */
	public Map<String, Object> callProcedure(String procdureName,
			SqlParameterSource in) {
		return getSimpleJdbcCall().withProcedureName(procdureName).execute(in);
	}

	public NamedParameterJdbcTemplate getNamedParameterJdbcTemplate() {
		return new NamedParameterJdbcTemplate(this.dataSource);
	}

	public SimpleJdbcInsert getSimpleJdbcInsert() {
		return new SimpleJdbcInsert(this.dataSource);
	}

	/**
	 * 查询返回结果为int类型的值
	 * 
	 * @param sql
	 *            查询语句
	 * @param sqlParam
	 *            使用Bean封装的查询条件
	 * @return 查询结果
	 * @throws DataAccessException
	 */
	public int queryForInt(String sql, BeanPropertySqlParameterSource sqlParam)
			throws DataAccessException {

		return this.getNamedParameterJdbcTemplate().queryForObject(sql,
				sqlParam, Integer.class);
	}

	/**
	 * 查询返回结果为long类型的值
	 * 
	 * @param sql
	 *            查询语句
	 * @param sqlParam
	 *            使用Bean封装的查询条件
	 * @return 查询结果
	 * @throws DataAccessException
	 */
	public long queryForLong(String sql, BeanPropertySqlParameterSource sqlParam)
			throws DataAccessException {

		return this.getNamedParameterJdbcTemplate().queryForObject(sql,
				sqlParam, Long.class);
	}

	/**
	 * 查询单一Bean结果
	 * 
	 * @param sql
	 *            查询语句
	 * @param rowMapper
	 *            使用BeanPropertyRowMapper，简化将结果集映射成JavaBean的操作
	 * @param sqlParam
	 *            使用Bean封装的查询条件
	 * @return 用Bean封装的查询结果
	 * @throws DataAccessException
	 */
	public <T> T queryForObject(String sql,
			BeanPropertySqlParameterSource sqlParam,
			BeanPropertyRowMapper<T> rowMapper) throws DataAccessException {

		return this.getNamedParameterJdbcTemplate().queryForObject(sql,
				sqlParam, rowMapper);
	}

	/**
	 * 查询单一Bean结果
	 * 
	 * @param sql
	 *            查询语句
	 * @param rowMapper
	 *            使用BeanPropertyRowMapper，简化将结果集映射成JavaBean的操作
	 * @param sqlParam
	 *            使用Map封装的查询条件
	 * @return 用Bean封装的查询结果
	 * @throws DataAccessException
	 */
	public <T> T queryForObject(String sql, Map<String, ?> sqlParam,
			BeanPropertyRowMapper<T> rowMapper) throws DataAccessException {

		return this.getNamedParameterJdbcTemplate().queryForObject(sql,
				sqlParam, rowMapper);
	}

	/**
	 * 数据增删改操作
	 * 
	 * @param sql
	 *            Insert/Update/Delete语句
	 * @param sqlParam
	 *            用Bean封装的更新条件
	 * @return SQL操作影响的数据行数
	 * @throws DataAccessException
	 */
	public int update(String sql, BeanPropertySqlParameterSource sqlParam)
			throws DataAccessException {

		return this.getNamedParameterJdbcTemplate().update(sql, sqlParam);
	}

	/**
	 * 单表根据主键值/唯一键按属性更新，单表映射到单独的Domain实体类
	 * 
	 * @param domainObject
	 *            Domain实体类
	 * @param tableName
	 *            表名
	 * @param keyColumnName
	 *            主键/唯一键列名
	 * @param columnNames
	 *            需要更新的属性对应的列名
	 * @return 更新操作影响的数据行数
	 * @throws DataAccessException
	 */
	public <T> int updateByProperties(T domainObject, String tableName,
			String keyColumnName, String... columnNames)
			throws DataAccessException {

		if (columnNames.length == 0)
			return 0;

		StringBuilder sqlBuilder = new StringBuilder();
		sqlBuilder.append("UPDATE ");
		sqlBuilder.append(tableName);
		sqlBuilder.append(" SET ");
		for (String columnName : columnNames) {
			sqlBuilder.append(columnName);
			sqlBuilder.append(" = :");
			sqlBuilder.append(SqlUtil.fieldNameToProperName(columnName));
			sqlBuilder.append(",");
		}
		sqlBuilder.deleteCharAt(sqlBuilder.length() - 1);
		sqlBuilder.append(" WHERE ");
		sqlBuilder.append(keyColumnName);
		sqlBuilder.append(" = :");
		sqlBuilder.append(SqlUtil.fieldNameToProperName(keyColumnName));

		if (logger.isDebugEnabled())
			logger.debug(sqlBuilder.toString());

		return this.update(sqlBuilder.toString(),
				new BeanPropertySqlParameterSource(domainObject));
	}

	/**
	 * 单表按属性删除，单表映射到单独的Domain实体类
	 * 
	 * @param domainObject
	 *            Domain实体类
	 * @param tableName
	 *            表名
	 * @param columnName
	 *            需要删除的属性对应的列名
	 * @return 删除操作影响的数据行数
	 * @throws DataAccessException
	 */
	public <T> int deleteByProperty(T domainObject, String tableName,
			String columnName) throws DataAccessException {

		StringBuilder sqlBuilder = new StringBuilder();
		sqlBuilder.append("DELETE FROM ");
		sqlBuilder.append(tableName);
		sqlBuilder.append(" WHERE ");
		sqlBuilder.append(columnName);
		sqlBuilder.append(" = :");
		sqlBuilder.append(SqlUtil.fieldNameToProperName(columnName));

		if (logger.isDebugEnabled())
			logger.debug(sqlBuilder.toString());

		return this.update(sqlBuilder.toString(),
				new BeanPropertySqlParameterSource(domainObject));
	}

	/**
	 * 执行count查询获得本次sql查询所能获得的记录总数 本函数只能自动处理简单的sql语句,复杂的sql查询请另行编写count语句查询.
	 * 
	 * @param sql
	 * @param sqlParam
	 * @return 记录总数
	 */
	public long countSqlResult(String sql,
			BeanPropertySqlParameterSource sqlParam) {
		return queryForLong(SqlUtil.prepareCountSql(sql), sqlParam);
	}

	/**
	 * 返回分页查询结果列表
	 * 
	 * @param sql
	 *            查询语句
	 * @param sqlParam
	 *            使用Bean封装的查询条件
	 * @param start
	 *            起始记录
	 * @param limit
	 *            单页显示记录数
	 * @return 查询结果列表，每一行记录映射成以列名为Key的Map
	 * @throws DataAccessException
	 */
	public List<Map<String, Object>> queryForPaginationList(String sql,
			BeanPropertySqlParameterSource sqlParam, int start, int limit)
			throws DataAccessException {

		return this.getNamedParameterJdbcTemplate().queryForList(
				this.buildPaginationSql(sql, start, limit), sqlParam);
	}

	/**
	 * 返回分页查询结果列表
	 * 
	 * @param sql
	 *            查询语句
	 * @param domainClass
	 *            映射JavaBean
	 * @param sqlParam
	 *            使用Bean封装的查询条件
	 * @param start
	 *            起始记录
	 * @param limit
	 *            单页显示记录数
	 * @return 查询结果列表，每一行记录自动映射成Bean
	 * @throws DataAccessException
	 */
	public <T> List<T> queryForPaginationList(String sql, Class<T> domainClass,
			BeanPropertySqlParameterSource sqlParam, int start, int limit)
			throws DataAccessException {

		return this.getNamedParameterJdbcTemplate().queryForList(
				this.buildPaginationSql(sql, start, limit), sqlParam,
				domainClass);
	}

	/**
	 * 构造分页查询语句
	 * 
	 * @param sql
	 *            原始SQL语句
	 * @param start
	 *            起始记录
	 * @param limit
	 *            单页显示记录数
	 * @return 分页SQL语句
	 */
	public String buildPaginationSql(String sql, int start, int limit) {

		StringBuilder sqlBuilder = new StringBuilder();

		sqlBuilder.append("SELECT zzz.* FROM (");
		sqlBuilder.append(sql);
		sqlBuilder.append(") zzz limit ");
		sqlBuilder.append(limit);
		sqlBuilder.append(" offset ");
		sqlBuilder.append(start);

		if (logger.isDebugEnabled())
			logger.debug(sqlBuilder.toString());
		return sqlBuilder.toString();
	}

	/**
	 * Mysql获得最后自动生成的自增性主键，在调用完插入语句后立即调用
	 * 
	 * @return 主键值
	 * @throws DataAccessException
	 */
	public long getAutoGeneratedPrimaryKey() throws DataAccessException {
		return this.queryForLong("SELECT LAST_INSERT_ID()", null);
	}

	/**
	 * 单表记录插入，单表映射到单独的Domain实体类
	 * 
	 * @param domainObject
	 *            Domain实体类
	 * @param tableName
	 *            表名
	 * @param keyColumnName
	 *            主键列名
	 * @param columnNames
	 *            插入时使用的列，不传时为插入除主键外的所有列
	 * @return 数据库自动生成的主键ID值
	 * @throws DataAccessException
	 */
	public <T> long create(T domainObject, String tableName,
			String keyColumnName, String... columnNames)
			throws DataAccessException {

		SimpleJdbcInsert insertActor = this.getSimpleJdbcInsert()
				.withTableName(tableName)
				.usingGeneratedKeyColumns(keyColumnName);

		if (columnNames.length > 0)
			insertActor = insertActor.usingColumns(columnNames);

		return insertActor.executeAndReturnKey(
				new BeanPropertySqlParameterSource(domainObject)).longValue();
	}

	/**
	 * 单表/视图单条件查询
	 * 
	 * @param domainClass
	 *            单表/视图对应的Domain类
	 * @param tableName
	 *            表名
	 * @param condition
	 *            查询条件
	 * @return 查询结果
	 * @throws DataAccessException
	 */
	public <T> List<T> queryDomainByProperty(Class<T> domainClass,
			String tableName, SimpleCondition condition)
			throws DataAccessException, IOException {
		StringBuilder sqlBuilder = new StringBuilder();
		sqlBuilder.append("SELECT * FROM $table");

		Map<String, Object> model = new HashMap<String, Object>();
		model.put("table", tableName);

		if (condition.isHasRealCondition()) {
			sqlBuilder
					.append(" WHERE $fieldName $condition #if($condition == \"like\")");
			sqlBuilder
					.append(" CONCAT(:propertyValue,'%')#else:propertyValue#end");

			model.put("fieldName",
					SqlUtil.properNameToFieldName(condition.getPropertyName()));
			model.put("condition", condition.getPropertyCondition());
		}

		if (condition.isPageable()) {
			sqlBuilder.append(" LIMIT $limit OFFSET $start");
			model.put("limit", condition.getLimit());
			model.put("start", condition.getStart());
		}

		if (logger.isDebugEnabled()) {
			logger.debug(sqlBuilder.toString());
			System.out.println(SqlUtil.renderSqlTemplate(sqlBuilder.toString(),
					model));
		}

		return this.getNamedParameterJdbcTemplate().query(
				SqlUtil.renderSqlTemplate(sqlBuilder.toString(), model),
				new BeanPropertySqlParameterSource(condition),
				new BeanPropertyRowMapper<T>(domainClass));
	}

	/**
	 * 单表/视图单条件查询单条记录
	 * 
	 * @param domainClass
	 *            单表/视图对应的Domain类
	 * @param tableName
	 *            表名
	 * @param condition
	 *            查询条件
	 * @return 查询结果，单条记录
	 * @throws DataAccessException
	 */
	public <T> T queryOneDomainByProperty(Class<T> domainClass,
			String tableName, SimpleCondition condition) throws IOException {
		condition.setLimit(1);
		List<T> lst = queryDomainByProperty(domainClass, tableName, condition);
		if (lst != null && !lst.isEmpty()) {
			return lst.get(0);
		}
		return null;
	}

	/**
	 * 构建类csv格式用逗号进行分割的字符串
	 * 
	 * @param list
	 * @return
	 */
	public <T> String buildCsvFormatString(List<T> list) {
		if (list == null || list.size() == 0) {
			return null;
		}

		StringBuffer sb = new StringBuffer();
		for (T t : list) {
			if (sb.length() != 0) {
				sb.append(",");
			}
			sb.append(t.toString());
		}
		return sb.toString();
	}
}
