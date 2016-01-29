package com.womai.bi;

import com.womai.bi.dao.AccountsDao;
import com.womai.bi.model.Accounts;
import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;

public class AccountsTest extends GeneralSpringTest {

    @Autowired
    private AccountsDao accountsDao;

    @Test
    public void selectByIdTest() {
        Accounts accounts = accountsDao.getAccount(66);
        System.out.println(accounts.getAccountName() + " =================");
    }

}


