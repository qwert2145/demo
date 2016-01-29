package com.womai.bi.util;

import org.apache.velocity.Template;
import org.apache.velocity.VelocityContext;
import org.apache.velocity.app.Velocity;
import org.apache.velocity.app.VelocityEngine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.util.Map;
import java.util.Properties;

/**
 * 简化Velocity的操作
 * 
 * @author wlb
 * 
 */
public final class VelocityUtil {

	private VelocityUtil() {
	}

	private static Logger logger = LoggerFactory.getLogger(VelocityUtil.class);

	/**
	 * 渲染模板内容.
	 * 
	 * @param templateContent
	 *            模板内容
	 * @param model
	 *            变量Map
	 */
	public static String renderTemplateContent(String templateContent,
			Map<String, ?> model) throws IOException {
		VelocityContext velocityContext = new VelocityContext(model);

		StringWriter result = new StringWriter();
		Velocity.evaluate(velocityContext, result, "", templateContent);
		return result.toString();
	}

	/**
	 * 渲染模板并生成UTF-8格式的文件，用于代码自动生成，用于网页自动生成的环境尚需检验
	 * 
	 * @param templateFileName
	 *            文件路径（相对于当前项目根目录） + 文件名
	 * @param model
	 *            变量Map
	 * @param targetFileName
	 *            生成的目标文件路径（相对于当前项目根目录）+文件名
	 * @return 文件生成是否成功
	 */
	public static boolean renderFile(String templateFileName,
			Map<String, ?> model, String targetFileName) {

		final String ENCODING = "UTF-8";

		try {
			VelocityEngine engine = new VelocityEngine();
			Properties prop = new Properties();
			String userPath = System.getProperty("user.dir");

			if (logger.isDebugEnabled())
				logger.debug("当前项目根目录" + userPath);

			prop.setProperty(Velocity.FILE_RESOURCE_LOADER_PATH, userPath);

			engine.init(prop);

			VelocityContext velocityContext = new VelocityContext(model);
			Template template = Velocity
					.getTemplate(templateFileName, ENCODING);

			FileOutputStream outputStream = new FileOutputStream(new File(
					userPath + targetFileName));

			OutputStreamWriter streamWriter = new OutputStreamWriter(
					outputStream, ENCODING);

			BufferedWriter writer = new BufferedWriter(streamWriter);
			template.merge(velocityContext, writer);
			writer.flush();
			writer.close();
			outputStream.close();

		} catch (Exception e) {
			logger.warn(e.getLocalizedMessage());
			return false;
		}
		return true;
	}
}