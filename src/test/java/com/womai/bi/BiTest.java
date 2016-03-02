package com.womai.bi;

import com.womai.bi.dao.BiDao;
import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;

public class BiTest extends GeneralSpringTest {

    @Autowired
    private BiDao biDao;

    @Test
    public void selectByIdTest() {
        biDao.getGaiKuang("yesterday");
        System.out.println("------------");
    }

}


