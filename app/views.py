#!/usr/bin/python2.7
# -*- coding: utf-8 -*-
import base64,re
import json
from flask import render_template, request, redirect, jsonify
from app import baseDir
from app.communication import calibra_call
from assist_view import *

@app.route('/')
def index():
    form = LoginForm()
    return render_template('index.html', title=u'泓申科技', form=form)

@app.route('/login', methods=['POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        username = request.form['username']
        password = request.form['password']
        user = find_user(username)
        if user:
            if user.Password == password:
                return redirect('/preview')
            else:
                passwordErrorMessage = u'密码错误！'
                return render_template('index.html',
                                       form=form,
                                       passwordErrorMessage=passwordErrorMessage)
        else:
            userNameErrorMessage = u'用户名不存在！'
            return render_template('index.html',
                                   form=form,
                                   userNameErrorMessage=userNameErrorMessage)

    return render_template('index.html',
                           title=u'泓申科技',
                           form=form)


# 初始化preview数据
@app.route('/preview', methods=['GET'])
def preview():
    if request.method == 'GET':
        form = PreviewForm()
        # 初始化select值
        init_select(form)
        form.process()
        # 初始化input值
        init_input(form)
        # 初始化radio值
        radioData = init_radio()
        return render_template('preview.html', form=form, radioData=radioData)


# 更新preview页面的配置数据
@app.route('/preview_Update', methods=['POST'])
def preview_ConfigUpdate():
    # 更新配置数据到数据库
    try:
        data = request.get_data()
        typeid = data.split('&')[0].split('=')[1]
        value = data.split('&')[1].split('=')[1]
        element = data.split('&')[2].split('=')[1]

        if element == 'input':
            set_sysparam_value(typeid, value)
        if element == 'select' or element == 'radio':
            set_sysparam_default(value)
        return jsonify(result='ok!')
    except Exception as e:
        log.error(msg=e.message)


startFlag = 0


# 触发标定
@app.route('/calibration', methods=['POST'])
def calibration():
    try:
        global startFlag
        print(u'启动标志:' + str(startFlag))
        if startFlag == 0:
            calibra_call.calibra_start()
            print(u'标定被调用')
            startFlag = 1
        curvalue = calibra_call.PROGRESS_VALUE
        status = calibra_call.PROGRESS_STATUS
        if status == 2:
            calibra_call.PROGRESS_VALUE = 0
            startFlag = 0
        return jsonify(current_value=curvalue, status=status)
    except Exception as e:
        log.error(msg=e.message)


# 查看标定结果图片
@app.route('/ShowPicture', methods=['GET'])
def ShowPicture():
    filepath = baseDir + '\\images\\'
    with open(filepath + 'biaoding.jpg', 'rb') as f:
        base64_data = base64.b64encode(f.read())

    return jsonify(imageData=base64_data)


# 画规则图
startRuleFlag = 0
@app.route('/ruleImage', methods=['GET'])
def ruleImage():
    global startRuleFlag
    if startRuleFlag == 0:
        calibra_call.ruleimage_start()
        startRuleFlag = 1
    calibra_call.imageCount=0
    # region 通讯不上则显示默认图片
    if calibra_call.imageData.value=='' or calibra_call.imageData.value== None:
        with open(baseDir + '\\static\\images\\rule\\default_alert.jpg', 'rb') as f:
            base64_data = base64.b64encode(f.read())
        return jsonify(imageData=base64_data)
    # endregion
    # region 通讯上了，获取通讯传来的数据
    base64_data = base64.b64encode(calibra_call.imageData)
    return jsonify(imageData=base64_data)
    # endregion


# 监听用户是否在浏览画规则页面，若离开，则停止画规则
@app.route('/ListenRuleImageStatus', methods=['GET'])
def ListenRuleImageStatus():
    calibra_call.listenRuleImageStatus()


# 停止画规则图
@app.route('/StopRuleImage', methods=['POST'])
def StopRuleImage():
    global startRuleFlag
    calibra_call.rulemage_stop()
    startRuleFlag = 0
    return jsonify(result='ok')


@app.route('/parameter', methods=['POST', 'GET'])
def parameter():
    if request.method == 'GET':
        parameterForm = ParameterForm()

        protocolTypes = find_sysparam_by_type(2)
        protocolTypeList, protocolTypeDefaultValue = convertRadioFormData(protocolTypes)
        parameterForm.protocolType.default = protocolTypeDefaultValue
        parameterForm.deviceName.default = find_sysparam_value(3)

        parameterForm.deviceNum.default = find_sysparam_value(4)

        parameterForm.deviceType.default = find_sysparam_value(5)

        parameterForm.deviceSerialNum.default = find_sysparam_value(6)

        parameterForm.masterVersion.default = find_sysparam_value(7)

        parameterForm.codeVersion.default = find_sysparam_value(8)

        parameterForm.channelCount.default = find_sysparam_value(9)

        parameterForm.ipAddress.default = getIPAddress()

        parameterForm.subnetMask.default = getSubnetMaskAddress()

        parameterForm.defaultGateway.default = getDefaultGatewayAddress()

        parameterForm.httpPort.default = find_sysparam_value(10)

        parameterForm.rtspPort.default = find_sysparam_value(11)

        parameterForm.httpsPort.default = find_sysparam_value(12)

        codeStreamTypes = find_sysparam_by_type(13)
        codeStreamTypeList, codeStreamTypeDefaultValue = convertRadioFormData(codeStreamTypes)
        parameterForm.codeStreamType.default = codeStreamTypeDefaultValue

        screenResolutions = find_sysparam_by_type(14)
        screenResolutionList, screenResolutionDefaultValue = convertRadioFormData(screenResolutions)
        parameterForm.screenResolution.default = screenResolutionDefaultValue

        codeRateTypes = find_sysparam_by_type(15)
        codeRateTypeList, codeRateTypeDefaultValue = convertRadioFormData(codeRateTypes)
        parameterForm.codeRateType.default = codeRateTypeDefaultValue

        parameterForm.videoFrameRate.default = find_sysparam_value(16)

        videoCodings = find_sysparam_by_type(17)
        videoCodingList, videoCodingDefaultValue = convertRadioFormData(videoCodings)
        parameterForm.videoCoding.default = videoCodingDefaultValue

        parameterForm.process()

        return render_template('parameter.html',
                               parameterForm=parameterForm)
    if request.method == 'POST':
        parameterForm = ParameterForm(request.form)
        if parameterForm.validate_on_submit():
            protocolTypeValue = parameterForm.protocolType.data
            set_sysparam_default(protocolTypeValue)

            deviceNameValue = parameterForm.deviceName.data
            set_sysparam_value(3, deviceNameValue)

            httpPortValue = parameterForm.httpPort.data
            set_sysparam_value(10, httpPortValue)

            rtspPortValue = parameterForm.rtspPort.data
            set_sysparam_value(11, rtspPortValue)

            httpsPortValue = parameterForm.httpsPort.data
            set_sysparam_value(12, httpsPortValue)

            codeStreamTypeValue = parameterForm.codeStreamType.data
            set_sysparam_default(codeStreamTypeValue)

            screenResolutionValue = parameterForm.screenResolution.data
            set_sysparam_default(screenResolutionValue)

            codeRateTypeValue = parameterForm.codeRateType.data
            set_sysparam_default(codeRateTypeValue)

            videoFrameRateValue = parameterForm.videoFrameRate.data
            set_sysparam_value(16, videoFrameRateValue)

            videoCodeValue = parameterForm.videoCoding.data
            set_sysparam_default(videoCodeValue)

            protocolTypes = find_sysparam_by_type(2)
            protocolTypeList, protocolTypeDefaultValue = convertRadioFormData(protocolTypes)
            parameterForm.protocolType.default = protocolTypeDefaultValue

            parameterForm.deviceName.default = deviceNameValue

            parameterForm.deviceNum.default = find_sysparam_value(4)

            parameterForm.deviceType.default = find_sysparam_value(5)

            parameterForm.deviceSerialNum.default = find_sysparam_value(6)

            parameterForm.masterVersion.default = find_sysparam_value(7)

            parameterForm.codeVersion.default = find_sysparam_value(8)

            parameterForm.channelCount.default = find_sysparam_value(9)

            parameterForm.ipAddress.default = getIPAddress()

            parameterForm.subnetMask.default = getSubnetMaskAddress()

            parameterForm.defaultGateway.default = getDefaultGatewayAddress()

            parameterForm.httpPort.default = httpPortValue

            parameterForm.rtspPort.default = rtspPortValue

            parameterForm.httpsPort.default = httpsPortValue

            parameterForm.codeStreamType.default = codeStreamTypeValue

            parameterForm.screenResolution.default = screenResolutionValue

            parameterForm.codeRateType.default = codeRateTypeValue

            parameterForm.videoFrameRate.default = videoFrameRateValue

            parameterForm.videoCoding.default = videoCodeValue

            parameterForm.process()

        return render_template('parameter.html',
                               parameterForm=parameterForm)


# 规格相关视图
# 初始化rule数据
@app.route('/rule', methods=['GET'])
def rule():
    ruleid = request.args.get('ruleid')
    if ruleid == None:
        form = RuleForm()
        form.ck_.default = True
        data = find_list_rules()
        ruleData = [SetRuleDic(x) for x in data if x.Id!='20110101']

        return render_template('rule.html', form=form, ruleData=ruleData)
    ruleTypeId = ruleid[0:4]
    return render_template('ruleEdit' + ruleTypeId + r'.html', form=GetRuleEditForm(ruleid), ruleid=ruleid)


# 更新规则激活状态
@app.route('/updateActiveStatus', methods=['POST'])
def updateActiveStatus():
    data = request.get_data()
    ruleid = data.split('&')[0].split('=')[1]
    ActiveFlag = data.split('&')[1].split('=')[1]
    # 更新数据库规则激活状态
    Update_rule(ruleid, {'IsActive': int(ActiveFlag)})
    # 通知通讯，当前规则id的监听状态
    calibra_call.NotifyRuleStatus(int(ruleid), int(ActiveFlag))
    return jsonify(result='ok')


# 监听规则状态是否正常工作
@app.route('/ListenRuleStatu')
def ListenRuleStatu():
    data = calibra_call.ruledata
    return jsonify(data)


@app.route('/UpdateRuleEdit', methods=['POST'])
def UpdateRuleEdit():
    jsondata = request.data
    # data = request.get_data()
    # ruleid=data.split('&')[0].split('=')[1]
    # model_name = data.split('&')[1].split('=')[1]
    # column_name = data.split('&')[2].split('=')[1]
    # column_value=data.split('&')[3].split('=')[1]
    # datadic={}
    # datadic[column_name]=column_value
    # Udate_RuleEdit(model_name,ruleid,datadic)
    return jsonify(result='ok')


@app.route('/UpdateRuleEdit1', methods=['POST'])
def UpdateRuleEdit1():
    data = request.get_data()
    data=json.loads(data)
    print(data)
    ruleid=data.pop('ruleid')
    for k in data:
        if k=='RuleParameter2004':
            Udate_RuleEdit(k,'20040101',data[k])
            continue
        Udate_RuleEdit(k,ruleid,data[k])
    # 发送通知
    calibra_call.NotityRuleChange(ruleid)
    return jsonify(result='ok')

@app.errorhandler(404)
def internal_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    # db.session.rollback()
    return render_template('500.html'), 500

@app.route('/tabTest')
def tabTest():
    # region 返回页面
    return render_template('tabTest.html')
    # endregion

@app.route('/test')
def test():
    return render_template('test.html')


@app.route('/drawRuleDetail2003', methods=['GET'])
def drawRuleDetail2003():
    ruleId = request.args.get('ruleId', '')
    if ruleId:
        rule2003=find_RuleEdit(ruleId)
        rule2004=find_RuleEdit('20040101')
        strdata={'Rule':{'xmlns_xsi':'http://www.w3.org/2001/XMLSchema-instance',
                        'xmlns_xsd':'http://www.w3.org/2001/XMLSchema',
                        'xmlns_xlink':'http://www.w3.org/1999/xlink',
                        'xmlns':'http://www.objectvideo.com/schemas/ovready',
                        'ID':ruleId,
                        'Name': rule2003.RuleType.Name ,
                        'IsActive':str(rule2003.IsActive),
                        'ViewInfo':{
                            '-xlink:type':'simple',
                            'ID':'0xf8f28c907ab7e1119d63e94ba45bf61b',
                            'xlink_href':'',
                            'Name':''
                        },
                        'EventDefinition':{
                            'xsi_type':rule2004.FastenerDrawType,
                            'Classifications':{
                                'Classification':rule2004.FastenerClassification
                            }
                        }

                        }
                }

        EventDefinitionNode=strdata['Rule']['EventDefinition']

        # region 讲闭锁器点坐标存入字典
        if (rule2004.FastenerDrawType == "TripwireEventDefinition"):
            EventDefinitionNode['Direction']=rule2004.FastenerDirection
            if(rule2004.FastenerPoints!='' or rule2004.FastenerPoints!=None ):
                result = re.split(r'\),\(', rule2004.FastenerPoints)
                result[0] = result[0][1:]
                result[-1] = result[-1][0:-1]
                result = [x.split(',') for x in result]
                def convert(x):
                    temp = {}
                    temp['X'] = x[0]
                    temp['Y']=x[1]
                    return temp
                result = map(convert, result)
                EventDefinitionNode['Points']={'Point':result}


        # endregion

        #region 闭锁器区域值存入字典
        EventDefinitionNode['Filters']=[{'Filter':[]}]
        filterNode=EventDefinitionNode['Filters'][0]['Filter']

        min={
            'xsi:type':'MinimumSizeFilter'
        }
        min['NearRectangle']={
            'X':str(rule2004.FastenerMinFilterNearX),
            'Y':str(rule2004.FastenerMinFilterNearY),
            'Width':str(rule2004.FastenerMinFilterNearWidth),
            'Height':str(rule2004.FastenerMinFilterNearHeight)
        }

        min['FarRectangle']={
            'X': str(rule2004.FastenerMinFilterFarX),
            'Y': str(rule2004.FastenerMinFilterFarY),
            'Width': str(rule2004.FastenerMinFilterFarWidth),
            'Height': str(rule2004.FastenerMinFilterFarHeight)
        }
        filterNode.append(min)
        #endregion

        strdata['Rule']['ResponseDefinition']={
            'xsi_type':'SimpleMessageResponse',
            'Message':rule2003.RuleType.Description
        }

    jsondata=json.dumps(strdata)
    print(jsondata)
    return jsondata



@app.route('/drawRuleDetail', methods=['GET'])
def drawRuleDetail():
    ruleId = request.args.get('ruleId', '')
    rule=find_RuleEdit(ruleId)
    json = "";
    if ruleId != None:
        rule = find_RuleEdit(ruleId)
        if (rule.Direction != None):
            if (rule.DrawType == "TripwireEventDefinition"):
                rule.Direction = "LeftToRight"
            if (rule.DrawType == "AreaOfInterestEventDefinition"):
                rule.Direction = "Ground"
            json += "{"
            json += '\"Rule\":{'
            json += '\"xmlns_xsi\":' + '\"http://www.w3.org/2001/XMLSchema-instance\",'
            json += '\"xmlns_xsd\":' + '\"http://www.w3.org/2001/XMLSchema\",'
            json += '\"xmlns_xlink\":' + '\"http://www.w3.org/1999/xlink\",'
            json += '\"xmlns\":' + '\"http://www.objectvideo.com/schemas/ovready\",'

            if (rule.Id != None):
                json += '\"ID\":' + "\"" + rule.Id + "\","

            json += "\"Name\":" + "\"" + rule.RuleType.Name + "\","
            json += "\"IsActive\":" + "\"" + str(rule.IsActive) + "\","
            json += "\"ViewInfo\":{" + "\"-xlink:type\":" + "\"simple\","
            json += "\"ID\":" + "\"0xf8f28c907ab7e1119d63e94ba45bf61b\","

            if (rule.Id != None):
                json += "\"xlink_href\":" + "\"\","
                json += "\"Name\":" + "\"\"},"
            else:
                json += "\"xlink_href\":" + "\"/api.rest/channels/" + rule.ChannelId + "/views/" + "0xf8f28c907ab7e1119d63e94ba45bf61b\","
                json += "\"Name\":" + "\"Default View\"},"

            json += "\"EventDefinition\":{"
            json += "\"xsi_type\":" + "\"" + rule.DrawType + "\","
            json += "\"Classifications\":{"

            classfications = []
            classfications = str(rule.Classification).split(',')
            classficationLength = len(classfications) - 1

            i = 0
            for classfication in classfications:  # 第一个实例
                if (i != classficationLength):
                    json += "\"Classification\":" + "\"" + classfication + "\","
                else:
                    json += "\"Classification\":" + "\"" + classfication + "\""
                i += 1
            json += "},"

            if (rule.DrawType == "AreaOfInterestEventDefinition"):
                json += "\"PlaneType\":" + "\"" + rule.Direction + "\","
                json += "\"Actions\":{" + "\"xsi_type\":\"" + "TakeAwayAreaAction" + "\"},"

            json += "\"Points\":{"
            if (rule.Points != None):
                json += "\"Point\":["
                points = []
                points = str(rule.Points).split('),')
                i = 0;
                pointLength = len(points) - 1
                for point in points:
                    #if (i != pointLength):
                    innerPoints = point.split(',')
                    json += "{"
                    json += "\"X\":" + "\"" + innerPoints[0].replace('(', '').replace(')', '') + "\","
                    json += "\"Y\":" + "\"" + innerPoints[1].replace('(', '').replace(')', '') + "\""
                    json += "},"
                    '''
                    else:
                        json += "{"
                        json += "\"X\":" + "\"" + innerPoints[0].replace('(', '').replace(')', '') + "\","
                        json += "\"Y\":" + "\"" + innerPoints[1].replace('(', '').replace(')', '') + "\"";
                        json += "}"
                    i += 1
                    '''
                json=json.strip(',')
                json += "]},"

            if hasattr(rule,'MinFilterNearX') or hasattr(rule,'MaxFilterNearX'):
                json += "\"Filters\":[{Filter:["
                if hasattr(rule,'MinFilterNearX'):
                    json += "{"
                    json += "\"xsi:type\":" + "\"MinimumSizeFilter\","
                    json += "\"NearRectangle\":{"
                    json += "\"X\":" + "\"" + str(rule.MinFilterNearX) + "\","
                    json += "\"Y\":" + "\"" + str(rule.MinFilterNearY) + "\","
                    json += "\"Width\":" + "\"" + str(rule.MinFilterNearWidth) + "\","
                    json += "\"Height\":" + "\"" + str(rule.MinFilterNearHeight) + "\"},"
                    json += "\"FarRectangle\":{"
                    json += "\"X\":" + "\"" + str(rule.MinFilterFarX) + "\","
                    json += "\"Y\":" + "\"" + str(rule.MinFilterFarY) + "\","
                    json += "\"Width\":" + "\"" + str(rule.MinFilterFarWidth) + "\","
                    json += "\"Height\":" + "\"" + str(rule.MinFilterFarHeight) + "\""
                    json += "}},"
                if hasattr(rule,'MaxFilterNearX'):
                    json += "{"
                    json += "\"xsi:type\":" + "\"MaximumSizeFilter\","
                    json += "\"NearRectangle\":{"
                    json += "\"X\":" + "\"" + str(rule.MaxFilterNearX) + "\","
                    json += "\"Y\":" + "\"" + str(rule.MaxFilterNearY) + "\","
                    json += "\"Width\":" + "\"" + str(rule.MaxFilterNearWidth) + "\","
                    json += "\"Height\":" + "\"" + str(rule.MaxFilterNearHeight) + "\"},"
                    json += "\"FarRectangle\":{"
                    json += "\"X\":" + "\"" + str(rule.MaxFilterFarX) + "\","
                    json += "\"Y\":" + "\"" + str(rule.MaxFilterFarY) + "\","
                    json += "\"Width\":" + "\"" + str(rule.MaxFilterFarWidth) + "\","
                    json += "\"Height\":" + "\"" + str(rule.MaxFilterFarHeight) + "\""
                    json += "}}"
                json +="]}],"
            json = json.strip(',')

            json+="},"
            json += "\"ResponseDefinition\":{" + "\"xsi_type\":" + "\"SimpleMessageResponse\","
            json += "\"Message\":" + "\"" + rule.RuleType.Description + "\"}}}"
    return json


