#!/usr/bin/python2.7
# -*- coding: utf-8 -*-
#
#
# '''
# @author: rabbit
#
# @contact: 739462304@qq.com
#
# @time: 2017/6/29 13:49
#
# @desc:
#
# '''
#
import  os
from time import  sleep
import threading
from app.dataaccess import find_rules
from ctypes import cdll,CFUNCTYPE,c_int,c_char_p,c_byte,POINTER,create_string_buffer,c_char

import base64
#
# # mydll= WinDLL(r'D:\03HS_Python\doubleWebSdk\ExDll\DoubleWebDll.dll')
#
# PROGRESS_VALUE=0
# PROGRESS_STATUS=1
# INIT_FLAG=0
# ruledata={}
# # __baseDir = r'D:\03HS_Python\BinocularCamera\app\lib\calibration'+ '\\'
# __baseDir = os.path.abspath('.') + '\\lib\\calibration\\'
#
# mydll = cdll.LoadLibrary(__baseDir+ 'DoubleWebDll.dll')
#
# CMFUNC = CFUNCTYPE(c_int,c_int,c_int,c_int,POINTER(c_char))
#
# # 标定回调函数
# def web_comm_func(a, b, c,d):
# 	'''
# 	标定和监控规则状态的回调函数
# 	:param a: 标定是，表示进度条状态（1，进行中，2完成）。3代表此时工作为监控规则状态
# 	:param b: 标定时，表示进度值，监控状态时，表示ruleid
# 	:param c: 标定时，表示数据长度，监控状态时，表示状态内容
# 	:param d: 标定时，表示数据状态
# 	:return:
# 	'''
# 	global ruledata
# 	if a==3:
# 		print('a:',a)
# 		print('b:',b)
# 		print('c:',c)
# 		ruledata[b]=c
# 		print (ruledata)
# 	if a!=3:
# 		print ('status:', a)
# 		print('progress:', b)
# 		print('len:', c)
# 		print('data:', d)
# 		global PROGRESS_VALUE,PROGRESS_STATUS
# 		PROGRESS_VALUE=b
# 		PROGRESS_STATUS=a
# 		# 如果进度已经完成，则将图片保存到服务器
# 		if a==2:
# 			data = create_string_buffer(c)
# 			for i in range(0, c):
# 				data[i] = d[i]
# 			filename=os.path.abspath('.') +'\\images\\biaoding.jpg'
# 			with open(filename,'wb') as f:
# 				f.write(data)
# 		return 1
#
# webcomm = CMFUNC(web_comm_func)
# # 初始化通讯模块
# def init_calibra():
# 	global INIT_FLAG
# 	if INIT_FLAG==0:
# 		r = mydll.InitalWebConn(webcomm)
# 		INIT_FLAG=1
#
#
# # 启动标定
# def calibra_start():
# 	init_calibra()
# 	mydll.WebReQStereoCamera()
#
#
# # 启动画规则
# imageData=None
# imageCount=0
# def ruleimage_start():
# 	global imageData
# 	init_calibra()
# 	imageData=create_string_buffer('',352*288*3)
# 	mydll.WebReQStartRuleImage(imageData,352*288*3)
#
#
# def run_thread():
# 	global imageCount
# 	while(imageCount<20):
# 		sleep(0.5)
# 		imageCount += 1
# 		print(imageCount)
# 	print(u'准备停止')
# 	rulemage_stop()
# 	print(u'已经停止')
#
#
#
# def listenRuleImageStatus():
# 	t1 = threading.Thread(target=run_thread)
# 	t1.start()
#
#
# # 停止画规则
# def rulemage_stop():
# 	init_calibra()
# 	mydll.WebReQStopRuleImage()
#
#
# def NotifyRuleStatus(ruletypeid,isopen):
#     '''
#     获取规则状态数据
#     :param ruleid: 规则id
#     :param isopen: 是否开启监听
#     :return:
#     '''
#     mydll.WebNotifyRuleActive(ruletypeid,isopen)
#
#
# def initRuleStatusData():
#     '''
#     初始化已经激活的规则
#     :return:
#     '''
#     init_calibra()
#     # 找到所有激活的规则id
#     ruledata=find_rules('IsActive=1')
#     # 遍历，发送通知
#     for rule in ruledata:
#         NotifyRuleStatus(int(rule.Id),1)
#
#
# def NotityRuleChange(ruleid):
# 	'''
# 	通知规则参数已经发送了变更
# 	:param ruleid: 规则id
# 	:return:
# 	'''
# 	mydll.WebNotifyRuleParam(int(ruleid))
#
#
