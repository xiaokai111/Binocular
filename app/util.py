#!/usr/bin/python2.7
# -*- coding: utf-8 -*-
from app import  log
def getMacAddress():
    '''
    @summary: return the MAC address of the computer
    '''
    import sys
    import os
    mac = None
    if sys.platform == "win32":
        for line in os.popen("ipconfig /all"):
            # print line.decode('gbk')
            lineChina = line.decode('gbk')
            if lineChina.lstrip().startswith("Physical Address"):
                mac = line.split(":")[1].strip().replace("-", ":")
                break
            elif lineChina.lstrip().startswith(u"物理地址"):
                mac = line.split(":")[1].strip().replace("-", ":")
                break
            # else:
            #     for line in os.popen("/sbin/ifconfig"):
            #         if 'Ether' in line:
            #             mac = line.split()[4]
            #             break
    return mac

def getIPAddress():
    '''
    @summary: return the MAC address of the computer
    '''
    import sys
    import os
    ip = None
    if sys.platform == "win32":
        for line in os.popen("ipconfig /all"):
            # print line.decode('gbk')
            lineChina = line.decode('gbk')
            if lineChina.lstrip().startswith("IPv4 Address"):
                ip = line.split(":")[1].strip().replace("-", ":")
                break
            elif lineChina.lstrip().startswith(u"IPv4 地址"):
                ip = line.split(":")[1].strip().replace("-", ":")
                ip = ip.split("(")[0].strip()
                break
    return ip

def getSubnetMaskAddress():
    '''
    @summary: return the MAC address of the computer
    '''
    import sys
    import os
    SubnetMask = None
    if sys.platform == "win32":
        for line in os.popen("ipconfig /all"):
            # print line.decode('gbk')
            lineChina = line.decode('gbk')
            if lineChina.lstrip().startswith("Subnet ask"):
                SubnetMask = line.split(":")[1].strip().replace("-", ":")
                break
            elif lineChina.lstrip().startswith(u"子网掩码 "):
                SubnetMask = line.split(":")[1].strip().replace("-", ":")
                break
    return SubnetMask

def getDefaultGatewayAddress():
    '''
    @summary: return the MAC address of the computer
    '''
    import sys
    import os
    defaultGateway = None
    if sys.platform == "win32":
        for line in os.popen("ipconfig /all"):
            # print line.decode('gbk')
            lineChina = line.decode('gbk')
            if lineChina.lstrip().startswith("Default Gateway"):
                defaultGateway = line.split(":")[1].strip().replace("-", ":")
                break
            elif lineChina.lstrip().startswith(u"默认网关"):
                defaultGateway = line.split(":")[1].strip().replace("-", ":")
                break
    return defaultGateway


# 将制定类型下的一系列参数id和默认id提取出来
def convertRadioFormData(radios):
    radioList = []
    defaultValue = 0
    for radio in radios:
        tempRadio = (str(radio.Id), radio.Name, )
        radioList.append(tempRadio)
        if radio.IsDefault == True:
            defaultValue = str(radio.Id)
    return (radioList, defaultValue)