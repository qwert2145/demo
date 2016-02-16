package com.womai.bi.dao;

import com.womai.bi.dao.util.SimpleDao;
import com.womai.bi.model.Accounts;
import com.womai.bi.model.Authorities;
import com.womai.bi.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.Map;

@Repository
public class UserDao {
	private static final Logger LOGGER = LoggerFactory.getLogger(UserDao.class);
	@Autowired
	private SimpleDao simpleDao;

	@Autowired
	private String sqlAccounts_getAccountsBy;

	@Autowired
	private String sqlUser_checkUser;

	private final String TABLE_NAME = "users";
	private final String AUTH_TABLE = "authorities";
	@Cacheable( value = "accountCache" , key = "#id")
	public Accounts getAccount(int id) {
		Map<String, Object> paramMap = new HashMap<String, Object>();
		paramMap.put("id", id);

		return simpleDao.queryForObject(sqlAccounts_getAccountsBy,
				paramMap, new BeanPropertyRowMapper<Accounts>(
						Accounts.class));
	}

	@CacheEvict(value="accountCache", allEntries=true)
	public void removeCache() {
		LOGGER.info("evict cache.");
	}

	public boolean changePassword(String userName, String passWord) {
		User user = new User();
		user.setUsername(userName);
		user.setPassword(passWord);
		return simpleDao.updateByProperties(user, TABLE_NAME, "username",
				"password") > 0;
	}

	public int checkUser(String username, String password) {
		Map<String, Object> paramMap = new HashMap<String, Object>();
		paramMap.put("username", username);
		paramMap.put("password", password);
		return simpleDao.getNamedParameterJdbcTemplate().queryForObject(
				sqlUser_checkUser, paramMap, Integer.class);
	}
	public long createUser(User user) {
		return simpleDao.create(user, TABLE_NAME, "id");
	}

	public long createAuthorities(Authorities authorities) {
		return simpleDao.create(authorities, AUTH_TABLE, "id");
	}
}
