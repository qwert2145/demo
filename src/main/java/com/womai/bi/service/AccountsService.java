package com.womai.bi.service;

import com.womai.bi.dao.AccountsDao;
import com.womai.bi.model.Accounts;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Created by wlb on 2016/1/28.
 */
@Service
@Transactional
public class AccountsService{

    @Autowired
    private AccountsDao accountsDao;

    public Accounts selectAccount(int id) {
        Accounts accounts = accountsDao.getAccount(id);
        return accounts;
    }

    public void deleteCache() {
        accountsDao.removeCache();
    }

}
