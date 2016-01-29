package com.womai.bi.dao;

import com.womai.bi.dao.util.SimpleDao;
import com.womai.bi.model.Accounts;
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
public class AccountsDao {
	private static final Logger LOGGER = LoggerFactory.getLogger(AccountsDao.class);
	@Autowired
	private SimpleDao simpleDao;

	@Autowired
	private String sqlAccounts_getAccountsBy;
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
}
