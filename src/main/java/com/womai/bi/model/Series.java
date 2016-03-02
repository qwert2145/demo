package com.womai.bi.model;

import java.util.List;

/**
 * Created by wlb on 2016/2/18.
 */
public class Series {
    private String name;
    private String type;
    private List<Object> data;
    public Series() {
        type = "line";
    }
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public List<Object> getData() {
        return data;
    }

    public void setData(List<Object> data) {
        this.data = data;
    }
}
