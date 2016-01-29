package com.womai.bi.dao.util;
/**
 * @author wlb SQL查询基础类
 * 
 */
public abstract class Condition {
	//查询起始记录，下标从0开始
	private int start = 0;
	//每页限制记录数，缺省为100
	private int limit = 100;
	
	// 不需要分页查询时，设置其为false
	private boolean isPageable = true;
	// 不带真正的查询条件时，设置其为false
	private boolean hasRealCondition = true;

	public int getStart() {
		return start;
	}

	public void setStart(int start) {
		this.start = start;
	}

	public int getLimit() {
		return limit;
	}

	public void setLimit(int limit) {
		this.limit = limit;
	}

	public boolean isPageable() {
		return isPageable;
	}

	public void setPageable(boolean isPageable) {
		this.isPageable = isPageable;
	}

	public boolean isHasRealCondition() {
		return hasRealCondition;
	}

	public void setHasRealCondition(boolean hasRealCondition) {
		this.hasRealCondition = hasRealCondition;
	}

}
