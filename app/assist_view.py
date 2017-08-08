#!/usr/bin/python2.7
# -*- coding: utf-8 -*-
'''
@author: rabbit

@contact: 739462304@qq.com

@time: 2017/7/13 17:16

@desc:存放了对view.py视图逻辑的辅助方法

'''

from dataaccess import *
from util import *
from flask import url_for
from forms import *
'''
规则部分业务辅助
===============================
'''
def GetRuleEditForm(ruleid):
    '''
    根据当前规则类型id，自动生成表单对象
    :param ruleTypeId:规则类型id
    :return:返回表单对象
    '''
    form=None
    if ruleid:
        ruleTypeId = ruleid[0:4]
        RuleEditName='RuleEdit'+ruleTypeId+'Form()'
        form=eval(RuleEditName)
    form=InitRuleEditFrom(form,ruleid)
    return form


def InitRuleEditFrom(form,ruleid):
    '''
    对规则编辑表单初始化值
    :param form:规则表单对象，为初始化
    :param ruleid:规则id
    :return:初始化后的表单
    '''
    Rule=find_combo_rule(ruleid)
    form.Rule_Plan.data=Rule.Plan
    form.Rule_RuleLevel.data=Rule.RuleLevel
    list=  [x for x in dir(form) if 'HS_' in x]
    if len(list)<=0:
        return form
    ruleparam = find_RuleEdit(ruleid)
    for v in list:
        input = getattr(form, v)
        columnname=v.split('_')[1]
        value = getattr(ruleparam,columnname)
        input.data = value
        input.id=columnname
        input.name=columnname
    return form



def SetRuleDic(x):
    '''
    将规则rule实体，转成需要的字典信息
    :param x: 为rule表实体对象
    :return: 字典对象
    '''
    dic = {}
    dic['ruleid'] = x.Id
    dic['url'] = url_for('rule', ruleid=x.Id)
    dic['urlname'] = x.RuleType.Name
    dic['desc'] = x.RuleType.Description
    dic['status'] = ''
    dic['activeflag'] = x.IsActive
    return dic

'''
preview页面辅助逻辑
===========================
'''
# 初始化radio
def init_radio():
    data={}
    result=find_sysparm_default(33)
    if result.Name==u'NPT校时':
        data['npt']='checked'
        data['no_auto']=''
    else:
        data['npt'] = ''
        data['no_auto'] = 'checked'
    return data


# 初始化select元素的值
def init_select(form):
    SetSelectValue(form,'select')

def SetSelectValue(obj,attr):
    list = [x for x in dir(obj) if attr in x]
    for v in list:
        select = getattr(obj, v)
        typeid = v.split('_')[1]
        Allparams = find_sysparam_by_type(typeid)
        params, DefaultValue = convertRadioFormData(Allparams)
        select.choices=params
        select.default=DefaultValue

# 初始化input元素的值
def init_input(form):
    SetInputValue(form,'input')

def SetInputValue(obj,attr):
    list=[x  for x in dir(obj) if attr in x]
    for v in list:
        input=getattr(obj,v)
        typeid=v.split('_')[1]
        value=find_sysparam_value(typeid)
        input.data=value
