#!/usr/bin/python2.7
# -*- coding: utf-8 -*-
from sqlalchemy import and_,text
from models import *

session = db.session

def find_user(username):
    '''
    查找用户
    :param username: 用户名
    :return: 返回符合的第一个用户实体
    '''
    if not username.strip():
        return None
    user = session.query(User).filter_by(Name=username).first()
    return user


def find_sysparam_value(typeid):
    '''
    根据参数类型id获取该类型下的默认参数值
    :param typeid: 参数类型id
    :return: 参数值
    '''
    result=find_sysparm_default(typeid)
    if result:
        return result.Value
    else:
        return None


def find_sysparm_default(typeid):
    '''
    查找参数类型id下的当前默认值的参数实体
    :param typeid: 参数类型id
    :return: 当前默认值所属参数实体
    '''
    if typeid:
        result = session.query(SysParam).filter(and_(SysParam.SysParamTypeId == typeid, SysParam.IsDefault == True)).first()
        if result:
            return result
    return None



def find_sysparam_by_type(typeid):
    '''
    查询SysParam类型下所有选项
    :param typeid: 参数类型id
    :return: 所有该类型下的所有参数实体
    '''
    if typeid:
        params = session.query(SysParam).filter(SysParam.SysParamTypeId == typeid).all()
        return params
    return None

def set_sysparam_value(typeid, value):
    '''
    设置SysParam的值
    :param typeid: 类型id
    :param value:参数值
    :return:
    '''
    if typeid and value:
        # 更新数据的第一种方法是查出来然后更改需要改变的字段
        session.query(SysParam).filter(SysParam.SysParamTypeId == typeid).update({"Value": value})
        '''
        #更新数据的另一种用法
        sysparam=SysParam(Id=paramid,Value=value)
        session.merge(sysparam)
        '''
        # 更新之后需要提交
        session.commit()




def set_sysparam_default(paramid, sysparamtypeid=None):
    '''
    设置参数的默认值
    :param paramid:参数id
    :param sysparamtypeid:参数类型id
    :return:
    '''
    if paramid:
        if sysparamtypeid is None:
            sysparamtypeid = (session.query(SysParam).filter(SysParam.Id == paramid).first()).SysParamTypeId
        session.query(SysParam).filter(SysParam.SysParamTypeId == sysparamtypeid).update({"IsDefault": False})
        session.flush()
        session.query(SysParam).filter(SysParam.Id == paramid).update({"IsDefault": True})
        session.commit()
    else:
        return


def find_list_rules():
    '''
    查询所有规则(不含规则参数)
    :return:返回所有规则信息
    '''
    result=session.query(Rule).join(Rule.RuleType).all()
    return result


def Update_rule(ruleid,data_dict):
    '''
    更新规则信息
    :param ruleid: 规则id
    :param data_dict: 待更改的数据，字典类型
    :return:
    '''
    if ruleid:
        session.query(Rule).filter(Rule.Id==ruleid).update(data_dict)
        session.commit()
    else:
        return

def Udate_RuleEdit(model_name,ruleid,data_dict):
    '''
    更新规则配置数据
    :param model_name: 规则实体名称
    :param ruleid: 规则id
    :param data_dict: 待更新的数据字典
    :return:
    '''
    if model_name and data_dict:
        model=eval(model_name)
        session.query(model).filter(model.Id == ruleid).update(data_dict)
        session.commit()
    else:
        return


def find_RuleEdit(ruleid):
    '''
    根据规则id查询出规则参数
    :param ruleid: 规则id
    :return: 返回单条规则
    '''
    if ruleid:
        ruletypeid=ruleid[0:4]
        model = eval('RuleParameter'+ruletypeid)
        ruleParams=session.query(model).filter(model.Id==ruleid).first()
        return ruleParams
    else:
        return  None


def find_combo_rule(ruleid):
    '''
     根据规则id查询出规则参数
    :param ruleid: 规则id
    :return: 返回单条规则
    '''
    if ruleid:
        rule=session.query(Rule).filter(Rule.Id==ruleid).first()
        return rule
    else:
        return None


def find_rules(sqlwhere):
    '''
    根据条件查询规则实体
    :param sqlwhere:
    :return:
    '''
    if sqlwhere:
        rules=session.query(Rule).filter(text(sqlwhere)).all()
        return rules
    else:
        return None


def find_alerts(sqlwhere):
    if sqlwhere:
        alerts=session.query(Alert).filter(text(sqlwhere)).all()
        return alerts
    else:
        return None


def find_alerts_count(sqlwhere):
    if sqlwhere:
        count=session.query(Alert).filter(text(sqlwhere)).count()
        return count
    else:
        return None