package com.womai.bi;

import com.womai.bi.dao.UserDao;
import com.womai.bi.model.Accounts;
import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;

public class AccountsTest extends GeneralSpringTest {

    @Autowired
    private UserDao userDao;

    @Test
    public void selectByIdTest() {
        Accounts accounts = userDao.getAccount(66);
        System.out.println(accounts.getAccountName() + " =================");
    }

}


