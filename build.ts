/*
插件有一个没有实现的模板库，平时写插件的时候引用的是这个模板库  
这个库里没有实现，只有空的各种类，函数和方法  
lib就是这个模板库  
 */
/**
 * 构建时，先把lib中的内容放入temp
 * 然后，在libs中扫描所有符合满月平台库格式的文件夹，依次将其放进根目录供插件源码引用并编译插件
 * 
 */
/**
 * LeviScript的实现会先把API的实现转成LLSE，再通过LSA的库转成LeviScript
 */
import {File, Logger} from "./lib/index.js"
Logger.info("开始构建")