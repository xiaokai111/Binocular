#ifndef WEBDOUBLE_COMM
#define WEBDOUBLE_COMM

#include "IPduDefine.h"
enum
{
	TYPE_STEREO_PRO = 0x001,
	TYPE_STEREO_RES = 0x002,
	TYPE_STATE_RES=0x003
};

//nType 进度状态，nResult进度值，nDataLen
typedef int (__stdcall * FUNC_WEB_CALLBACK)(int nType,int nResult,int nDataLen,char * pData);



extern "C" int __stdcall InitalWebConn(FUNC_WEB_CALLBACK pCallBack);

//ReQ
extern "C" int __stdcall WebReQStereoCamera();

返回0代表成功
extern "C" int __stdcall WebReQStartRuleImage(char * pBuffer,int nMaxLen);

extern "C" int __stdcall WebReQStopRuleImage();

//Notify
extern "C" int __stdcall WebNotifyRuleParam(int nRuleId);


extern "C" int __stdcall WebNotifyRuleActive(int nRuleId,int nopen);

//set
extern "C" int __stdcall WebSetSystemParam(int sysid);

#endif // WEBDOUBLE_COMM

