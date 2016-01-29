package com.womai.bi.controller;

import com.alibaba.fastjson.JSON;
import com.womai.bi.model.Accounts;
import com.womai.bi.service.AccountsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
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
    @RequestMapping(value = "/index/{id}",method = RequestMethod.GET)
    @ResponseBody
    public String index(@PathVariable int id) {
        Accounts accounts = accountsService.selectAccount(id);
        String jsonStr = JSON.toJSONString(accounts);
        return jsonStr;
    }

    @RequestMapping(value = "/remove",method ={RequestMethod.POST,RequestMethod.GET})
    @ResponseBody
    public String removeCache() {
        accountsService.deleteCache();
        return "remove cache";
    }
}
