/**
 * Project Untitled
 */

#ifndef _IPDUDEFINE_H
#define _IPDUDEFINE_H

#pragma once
#define HSA_TAIL		1		//尾随
#define HSA_FIRE		2		//火焰
#define HSA_PUSHIN		3		//推入
#define HSA_FIGHT		4		//疑似打斗
#define	HSA_AD			5		//广告
#define HSA_SCREAM		6		//尖叫
#define HSA_SQUAT		7		//下蹲
#define HSA_LOST		8		//物品遗留
#define HSA_TAILHSA_FIGHT	9		//尾随抢劫
#define HSA_PUSHIN_FIGHT	10		//推入抢劫

#define AREA_HEAD_VIDEO  2002;
#define HEAD_VIDEO_NAME "头顶"
/////////////////////CLIENT//////////////////////////
//版本验证请求
#define PDU_RQ_CHECKVERSION      22
//sdk版本号字符串长度	    nSdkVersionLen	            int
//sdk版本号字符串	        szSdkVersion	            char*(String)
//sdk兼容的版本字符串长度	nCompatibilityVersionLen	int
//sdk兼容的版本字符串	    szCompatibilityVersion	    char*(String)

//版本验证回馈
#define PDU_RP_CHECKVERSION	62
//验证结果(1为成功0为失败）	   nCheckResult	int
//设备版本(验证成功)	       szDeviceVersion	char*(String)
//设备兼容版本(验证失败)	   szCompatibilityVersion	char*(String)

//设备登陆请求
#define PDU_RQ_LOGIN	23
//用户名长度	nUsernameLen	int
//用户名	szUsername	char*(String)
//密码长度	nPasswordLen	int
//密码	szPassword	char*(String)

//设备登陆回馈
#define PDU_RP_LOGIN	63
//验证结果(1为成功，0为失败）	nVerifyResult	int

//设备信息请求
#define PDU_RQ_DEVICEINFO	24

//设备信息回馈
#define PDU_RP_DEVICEINFO	64
//设备序列号 	szDeviceSerialNo	char*(String)
//设备版本号	szDeviceVersion	char*(String)
//设备路数lic	nViewLic	int
//设备启用通道数(以下&打头代表循环）	nAreas	int
//&通道号	nSrcIndex	int
//&区域类型Id(防护舱1､防护舱2､大厅等）	nAreaId	int
//&通道类型（防护舱、大厅、周界）	nAreaTypeId	int
//&通道名称	szChannelName	char*(String)
//&临时占位符(补值1)	nTemp	int
//控制器个数(GPIO口个数)(&循环）	nScCount	int
//&控制器id	nScId	int
//&控制器名称	szScName	char*(String)
//音频个数	nAudioCount	int
//&音频绑定区域id	nAreaId	int
//&音频通道名称	nAudioChannelName	char*(String)
//&音频类型(模拟卡还是随通道获取)	nSoundType	int
//&音频Id	nAudioChannelId	int
//当天人流量	nCurrentDayPeopleCount	int


//双目摄像头人员统计
#define PDU_RQ_PEOPLECOUNTS      30
//nStartTimeLen	int
//szStartTime	char*(String)	格式:201705021518(只到分钟)
//nEndTimeLen	int
//szEndTime	char*(String)	格式:201705021518(只到分钟)

#define PDU_RP_PEOPLECOUNTS      70
//int		nPeopleNum	         人员个数

//舱内信号通知
#define  PDU_NOTIFY_SIGNAL	86
//数据头	PDU_NOTIFY_SIGNAL	int
//类型	nSignalType	int	0:红外信号；1:门闭合信号；2:进门按钮；3：出门按钮
//值	nValue	int	0：没人/开门状态/按钮release；1：有人/闭合状态/按钮Press

//人员进入
#define PDU_NOTIFY_PEOPLEENTER	87
//数据头	 PDU_NOTIFY_PEOPLEENTER	    int
//通道Id	 nChannelNo	            int
//舱内人员数 nPeopleCountCur          int

//人员离开
#define PDU_NOTIFY_PEOPLELEAVE	88
//数据头	 PDU_NOTIFY_PEOPLELEAVE	int
//通道Id	 nChannelNo	        int
//舱内人员数 nPeopleCountCur      int
//当天人数   nPeopleCount	        int

//      作弊模式
#define PDU_NOTIFY_MANUAL_RQ   90
//       数据头	 PDU_NOTIFY_MANUAL_RQ   int
//       通道Id	 nChannelNo	        int
//       报警类型 nType                  int

//       报警通知

#define PDU_NOTIFY_ALERT	85
//       数据头		PDU_NOTIFY_ALERT	int
//       报警等级	nAlertLevel	int
//       报警通道	byChannelNo	byte
//       通道名称	szChannelName	char*(String)
//       年	        shYear		short//
//       月	        shMonth		short//
//       日	        shDay		short//
//       时	        shHour		short//
//       分	        shMinute	short//
//       秒		shSec		short//
//       规则Id		szRuleId	char*(String)
//       规则类型	szRuleTypeId	char*(String)//  2003尾随   2018火焰
//       规则名称	szRuleTypeName	char*(String)
//       报警详细描述	szAlertPlan	char*(String)
//       报警文件名称	szFileName	char*(String)
//       报警图片个数	byImgCount	byte//
//       &报警图片大小	nImageSize	int//
//       &报警图片数据 	byImgData	bye[]//

///////////////////WEB////////////////////////////

//change rule state
#define PDU_RQ_RULESTATE         104
//int       nruleid             ruleid

#define PDU_RQ_RULEPARAM         105
//int       nruleid             get ruleid and read sqlite

#define PDU_RQ_STARTSTEREO       106

#define PDU_RP_STEREORESULT      107
//int       nresult
//int       nimagelen
//char *    pdata
#define PDU_RP_STEREOPRO         111


#define PDU_RQ_RULEIMAGE        108

#define PDU_RP_RULEIMAEG        109 //compose image for rule
//int                nIndex       index
//int                nImageLength 图像长度
//unsigned char*     ImageData    图像
#define PDU_RQ_STOPIMAGE        110 //stop image for rule

//#define PUD_RQ_RULEACTIVE       111 // open or close rule
//int nRuleId

#define MSG_ALERT_CALLBACK 901
#define MSG_PEOPLE_CALLBACK 902

#define MAX_IMAGE_COUNT 10
#define MAX_PATH_LEN    128


//web net port
#define PORT_NETMODULE_SERVER 16010
#define PORT_WEBMODULE_SERVER 16000

#endif //_IPDUDEFINE_H
