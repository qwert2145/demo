package com.womai.bi.controller;

import com.alibaba.fastjson.JSON;
import com.womai.bi.model.Accounts;
import com.womai.bi.service.AccountsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

/**
 * Created by wlb on 2016/1/28.
 */
@Controller
@RequestMapping("/accounts")
public class AccountsController {
    @Autowired
    private AccountsService accountsService;
    /*列表*/
    @RequestMapping(value = "/index",method = RequestMethod.GET)
    @ResponseBody
    public String index() {
        Accounts accounts = accountsService.selectAccount(6);
//        ModelAndView modelAndView = new ModelAndView("accounts/index");
//        modelAndView.addObject("accounts", accounts);
        String jsonStr = JSON.toJSONString(accounts);
        return jsonStr;
    }
}
