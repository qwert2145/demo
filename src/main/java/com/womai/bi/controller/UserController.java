package com.womai.bi.controller;

import com.alibaba.fastjson.JSON;
import com.womai.bi.model.Accounts;
import com.womai.bi.model.User;
import com.womai.bi.service.UserService;
import com.womai.bi.util.MD5Util;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;

/**
 * Created by wlb on 2016/1/28.
 */
@Controller
public class UserController {
    private static final Logger LOGGER = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserService userService;
    /*列表*/
    @RequestMapping(value = "/index/{id}",method = RequestMethod.GET)
    @ResponseBody
    public String index(@PathVariable int id) {
        Accounts accounts = userService.selectAccount(id);
        String jsonStr = JSON.toJSONString(accounts);
        return jsonStr;
    }

    @RequestMapping(value = "/remove",method ={RequestMethod.POST,RequestMethod.GET})
    @ResponseBody
    public String removeCache() {
        userService.deleteCache();
        return "remove cache";
    }

    @RequestMapping(value = "/login", method = RequestMethod.GET)
    public ModelAndView login() {
        ModelAndView model = new ModelAndView();
        model.setViewName("login");
        return model;
    }

    @RequestMapping(value = "/logout", method = RequestMethod.GET)
    public ModelAndView home() {
        ModelAndView model = new ModelAndView();
        model.setViewName("logout");
        return model;
    }

    @RequestMapping(value = "/accessDenied", method = RequestMethod.GET)
    public ModelAndView accessDenied() {
        ModelAndView model = new ModelAndView();
        model.setViewName("accessDenied");
        return model;
    }

    @RequestMapping(value = "/status403", method = RequestMethod.GET)
    public ModelAndView accessDenied404() {
        ModelAndView model = new ModelAndView();
        model.setViewName("status403");
        return model;
    }

    @RequestMapping(value = "/createUser", method = RequestMethod.GET)
    @ResponseBody
    public String createUser(String userName,String passWord,String authority) {
        User user = new User();
        user.setUsername(userName);
        user.setPassword(MD5Util.MD5(passWord));
        user.setEnabled(true);
        long result = userService.createUser(user, authority);
        //用户已存在
        if(result == 0){
            return "0";
        }else{
            return "1";
        }
    }

    @RequestMapping(value = "/changePass", method = RequestMethod.GET)
    @ResponseBody
    public String changePass(String userName,String passWord) {
        boolean result = userService.changePassword(userName, MD5Util.MD5(passWord));
        if(result == true){
            return "1";
        }else {
            return "0";
        }
    }

    @RequestMapping(value = "/isAdmin", method = RequestMethod.GET)
    @ResponseBody
    public String isAdmin() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
        Object[] sga =userDetails.getAuthorities().toArray();
        String result = "0";
        for(int i=0;i<sga.length;i++){
            String role = ((SimpleGrantedAuthority)sga[0]).getAuthority();
            if("admin".equals(role)) {
                result = "1";
                break;
            }
        }
        return result;
    }
}
