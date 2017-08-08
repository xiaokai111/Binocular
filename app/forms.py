#!/usr/bin/python2.7
# -*- coding: utf-8 -*-
from flask_wtf import FlaskForm
from wtforms import StringField, BooleanField, PasswordField, RadioField, IntegerField,SelectField,TextAreaField
from wtforms.validators import DataRequired, InputRequired,NumberRange
from app.dataaccess import find_sysparam_by_type
from app.util import convertRadioFormData


class LoginForm(FlaskForm):
    username = StringField('username', validators=[DataRequired(message=u'用户名不能为空！')])
    password = PasswordField('password', validators=[DataRequired(message=u'密码不能为空！')])

class ParameterForm(FlaskForm):
    # 协议类型
    protocolTypes = find_sysparam_by_type(2)
    protocolTypeList, protocolTypeDefaultValue = convertRadioFormData(protocolTypes)
    protocolType = RadioField('protocolType', choices=protocolTypeList)

    # 设备名称
    deviceName = StringField('deviceName', validators=[InputRequired(message=u'设备名称不能为空！')])
    # 设备编号
    deviceNum = StringField('deviceNum')
    # 设备型号
    deviceType = StringField('deviceType')
    # 设备序列号
    deviceSerialNum = StringField('deviceSerialNum')
    # 主控版本
    masterVersion = StringField('masterVersion')
    # 编码版本
    codeVersion = StringField('codeVersion')
    # 通道个数
    channelCount = StringField('channelCount')

    # 设备IPv4地址
    ipAddress = StringField('ipAddress')
    # IPv4子网掩码
    subnetMask = StringField('subnetMask')
    # IPv4默认网关
    defaultGateway = StringField('defaultGateway')

    # HTTP端口
    httpPort = StringField('httpPort', validators=[DataRequired(message=u'HTPP 端口不能为空！')])
    # RTSP端口
    rtspPort = StringField('rtspPort', validators=[DataRequired(message=u'RTSP 端口不能为空！')])
    # HTTPS端口
    httpsPort = StringField('httpsPort', validators=[DataRequired(message=u'HTTPS 端口不能为空！')])

    # 码流类型
    codeStreamTypes = find_sysparam_by_type(13)
    codeStreamTypeList, codeStreamTypeDefaultValue = convertRadioFormData(codeStreamTypes)
    codeStreamType = RadioField('codeStreamType', choices=codeStreamTypeList)

    # 分辨率
    screenResolutions = find_sysparam_by_type(14)
    screenResolutionList, screenResolutionDefaultValue = convertRadioFormData(screenResolutions)
    screenResolution = RadioField('screenResolution', choices=screenResolutionList)

    # 码率类型
    codeRateTypes = find_sysparam_by_type(15)
    codeRateTypeList, codeRateTypeDefaultValue = convertRadioFormData(codeRateTypes)
    codeRateType = RadioField('codeRateType', choices=codeRateTypeList)

    # 视频帧率
    videoFrameRate = IntegerField('videoFrameRate', validators=[NumberRange(min=1, max=25, message=u'范围只能在 1-25')])

    # 视频编码
    videoCodings = find_sysparam_by_type(17)
    videoCodingList, videoCodingDefaultValue = convertRadioFormData(videoCodings)
    videoCoding = RadioField('videoCoding', choices=videoCodingList)



class PreviewForm(FlaskForm):
    # 亮度
    input_18=IntegerField('brightness')
    # 对比度
    input_19=IntegerField('contrast')
    # 饱和度
    input_20=IntegerField('saturability')
    # 锐度
    input_21=IntegerField('acutance')
    # 曝光时间
    select_22=SelectField('exposure_time',choices=[(22,'1/25')])
    # 背光补偿
    select_23=SelectField('backlight_compensation',choices=[(23,'开启')])
    # 宽动态
    select_24=SelectField('Wide_dynamic',choices=[(24,'开启')])
    # 强光抑制
    select_25 = SelectField('Wide_dynamic', choices=[(25, '开启')])
    # 白平衡
    select_26= SelectField('Wide_dynamic', choices=[(26, '自动白平衡')])
    # 自动增益控制
    select_27 = SelectField('Wide_dynamic', choices=[(27, '开启')])
    # 日夜模式
    select_28= SelectField('Wide_dynamic', choices=[(28, '白天')])
    # 显示日期
    select_29= SelectField('Wide_dynamic', choices=[(1, 'a')])
    # 显示时间
    select_30= SelectField('Wide_dynamic', choices=[(1, 'a')])
    # 时间位置
    select_31 = SelectField('Wide_dynamic', choices=[(1, 'a')])
    # 叠加编号
    select_32 = SelectField('Wide_dynamic', choices=[(1, 'a')])
    #时钟同步方式
    radio_33=RadioField('screenResolution',choices=[(1,'a'),(2,'b')])
    # 时钟同步服务器地址
    input_34 = IntegerField('contrast')
    # NTP端口
    input_35 = IntegerField('contrast')
    # 校时时间间隔
    input_36 = IntegerField('contrast')

class RuleForm(FlaskForm):
    ck_=BooleanField('ck_',default=False)


class RuleEditForm(FlaskForm):
    '''
    规则参数基础表单
    '''
    # 预置方案
    Rule_Plan = TextAreaField('plan')
    # 规则等级
    Rule_RuleLevel=IntegerField('RuleLevel')

class RuleEdit1002Form(RuleEditForm):
    # 敏感度
    HS_Sensitivity=IntegerField('Sensitivity')

class RuleEdit2004Form(RuleEditForm):
    pass

class RuleEdit2009Form(RuleEditForm):
    # 敏感度
    HS_Sensitivity=IntegerField('Sensitivity')


class RuleEdit2005Form(RuleEditForm):
    # 敏感度
    HS_Sensitivity = IntegerField('Sensitivity')
    # 延迟(1-60)
    HS_RuleDelay=IntegerField('RuleDelay')

class RuleEdit2017Form(RuleEditForm):
    # 延迟(1-60)
    HS_RuleDelay = IntegerField('RuleDelay')

class RuleEdit2119Form(RuleEditForm):
    # 延迟(1-60)
    HS_RuleDelay = IntegerField('RuleDelay')
    HS_Height=IntegerField('HS_Height')


class RuleEdit2011Form(RuleEditForm):
    # 延迟(1-60)
    HS_RuleDelay = IntegerField('RuleDelay')


class RuleEdit2018Form(RuleEditForm):
    # 敏感度
    HS_Sensitivity = IntegerField('Sensitivity')

class RuleEdit2003Form(RuleEditForm):
    # 延迟(1-60)
    HS_RuleDelay = IntegerField('RuleDelay')
    # 敏感度
    HS_Sensitivity = IntegerField('Sensitivity')


class RuleEdit2004Form(RuleEditForm):
    pass

class RuleEdit2101Form(RuleEditForm):
    pass

class RuleEdit2103Form(RuleEditForm):
    pass

class RuleEdit2105Form(RuleEditForm):
    pass

class RuleEdit2106Form(RuleEditForm):
    pass






