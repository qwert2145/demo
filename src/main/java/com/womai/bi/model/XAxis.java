package com.womai.bi.model;

import java.io.Serializable;
import java.util.List;

/**
 * Created by wlb on 2016/2/18.
 */
public class XAxis implements Serializable {
    private String type;
    private boolean boundaryGap;
    private List<String> data;
    public XAxis(){
        type = "category";
        boundaryGap =false;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public boolean isBoundaryGap() {
        return boundaryGap;
    }

    public void setBoundaryGap(boolean boundaryGap) {
        this.boundaryGap = boundaryGap;
    }

    public List<String> getData() {
        return data;
    }

    public void setData(List<String> data) {
        this.data = data;
    }
}
