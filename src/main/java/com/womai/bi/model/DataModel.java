package com.womai.bi.model;

import java.util.List;
import java.util.Map;

/**
 * Created by wlb on 2016/2/18.
 */
public class DataModel {
    private Map<String,List<String>> legend;
    private Grid grid;
    private List<XAxis> xAxis;
    private List<YAxis> yAxis;
    private List<Series> series;

    public Map<String, List<String>> getLegend() {
        return legend;
    }

    public void setLegend(Map<String, List<String>> legend) {
        this.legend = legend;
    }

    public Grid getGrid() {
        return grid;
    }

    public void setGrid(Grid grid) {
        this.grid = grid;
    }

    public List<Series> getSeries() {
        return series;
    }

    public void setSeries(List<Series> series) {
        this.series = series;
    }

    public List<YAxis> getYAxis() {
        return yAxis;
    }

    public void setYAxis(List<YAxis> yAxis) {
        this.yAxis = yAxis;
    }

    public List<XAxis> getXAxis() {
        return xAxis;
    }

    public void setXAxis(List<XAxis> xAxis) {
        this.xAxis = xAxis;
    }

}
