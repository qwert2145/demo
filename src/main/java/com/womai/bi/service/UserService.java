package com.womai.bi.service;

import com.womai.bi.dao.UserDao;
import com.womai.bi.model.Accounts;
import com.womai.bi.model.Authorities;
import com.womai.bi.model.User;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Created by wlb on 2016/1/28.
 */
@Service
@Transactional
public class UserService {

    @Autowired
    private UserDao userDao;

    public Accounts selectAccount(int id) {
        Accounts accounts = userDao.getAccount(id);
        return accounts;
    }

    public void deleteCache() {
        userDao.removeCache();
    }
    public Accounts getAccount(String accountName) {
        return null;
    }

    @Transactional
    public boolean changePassword(String userName, String passWord) {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
        String loginUser = userDetails.getUsername();
        if("admin".equals(loginUser) || userName.equals(loginUser)){
            return userDao.changePassword(userName,passWord);
        }
        return false;
    }

    @Transactional
    public long createUser(User user,String authority) {
        int count = userDao.checkUser(user.getUsername(), user.getPassword());
        //count > 0 用户已存在
        if(count > 0){
            return 0;
        }

        final String DEFAULT_PASSWORD = "123456";
        if (StringUtils.isBlank(user.getPassword())) {
            user.setPassword(DEFAULT_PASSWORD);
        } else {
            user.setPassword(user.getPassword());
        }

        long id = userDao.createUser(user);
        Authorities authorities = new Authorities();
        authorities.setUsername(user.getUsername());
        authorities.setAuthority(authority);
        userDao.createAuthorities(authorities);
        return id;
    }
}
