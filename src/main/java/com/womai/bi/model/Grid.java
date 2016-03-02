package com.womai.bi.model;

/**
 * Created by wlb on 2016/2/18.
 */
public class Grid {
    private String left;
    private String right;
    private String bottom;
    private boolean containLabel;
    public Grid(){
        left = "3%";
        right = "4%";
        bottom = "3%";
        containLabel = true;
    }

    public String getLeft() {
        return left;
    }

    public void setLeft(String left) {
        this.left = left;
    }

    public String getRight() {
        return right;
    }

    public void setRight(String right) {
        this.right = right;
    }

    public String getBottom() {
        return bottom;
    }

    public void setBottom(String bottom) {
        this.bottom = bottom;
    }

    public boolean isContainLabel() {
        return containLabel;
    }

    public void setContainLabel(boolean containLabel) {
        this.containLabel = containLabel;
    }
}
