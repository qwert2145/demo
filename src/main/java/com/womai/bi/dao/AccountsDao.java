package com.womai.bi.dao;

import com.womai.bi.dao.util.SimpleDao;
import com.womai.bi.model.Accounts;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.Map;

@Repository
public class AccountsDao {
	@Autowired
	private SimpleDao simpleDao;

	@Autowired
	private String sqlAccounts_getAccountsBy;

	public Accounts getAccount(int id) {
		Map<String, Object> paramMap = new HashMap<String, Object>();
		paramMap.put("id", id);

		return simpleDao.queryForObject(sqlAccounts_getAccountsBy,
				paramMap, new BeanPropertyRowMapper<Accounts>(
						Accounts.class));
	}
	
}
