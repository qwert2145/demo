package com.womai.bi.dao.util;

/**
 * @author wlb
 * 
 * @desc 简单条件查询，主要用于单表/单视图Domain按单个属性查询
 * 
 */
public class SimpleCondition extends Condition {
	private String propertyName;
	private String propertyCondition;
	private Object propertyValue;

	public String getPropertyName() {
		return propertyName;
	}

	public void setPropertyName(String propertyName) {
		this.propertyName = propertyName;
	}

	public String getPropertyCondition() {
		return propertyCondition;
	}

	public void setPropertyCondition(String propertyCondition) {
		this.propertyCondition = propertyCondition;
	}

	public Object getPropertyValue() {
		return propertyValue;
	}

	public void setPropertyValue(Object propertyValue) {
		this.propertyValue = propertyValue;
	}

}