#!/usr/bin/python2.7
# -*- coding: utf-8 -*-
from app import app
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Table, Column, ForeignKey, Integer, String, DateTime, Time, LargeBinary, Boolean, Float, Numeric
from sqlalchemy.orm import relationship
import datetime

# SQLAlchemy类的实例，表示程序使用的数据库，同时获得了Flask-SQLAlchemy提供的所有功能。
db = SQLAlchemy(app)


# 用户实体
class User(db.Model):
    __tablename__ = 'User'
    Name = Column(String, primary_key=True)
    Password = Column(String, nullable=False)

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        return unicode(self.Name)


class SysParamType(db.Model):
    __tablename__ = 'SysParamType'
    Id = Column(Integer, primary_key=True)
    Name = Column(String, unique=True, nullable=False)
    SysParams = relationship("SysParam", back_populates="SysParamType")


class SysParam(db.Model):
    __tablename__ = 'SysParam'
    Id = Column(Integer, primary_key=True)
    SysParamTypeId = Column(Integer, ForeignKey("SysParamType.Id"))
    Name = Column(String)
    Value = Column(String, nullable=False)
    IsDefault = Column(Boolean, default=False)
    SysParamType = relationship("SysParamType", back_populates="SysParams")


class RuleType(db.Model):
    __tablename__ = 'RuleType'
    Id = Column(Integer, primary_key=True)
    Name = Column(String, nullable=False)
    Description = Column(String, nullable=False)
    Rules = relationship("Rule", back_populates="RuleType")


Rule_Schedule = Table('Rule_Schedule', db.Model.metadata,
                      Column('RuleId', String(10), ForeignKey('Rule.Id')),
                      Column('ScheduleId', Integer, ForeignKey('Schedule.Id'))
                      )


class Schedule(db.Model):
    __tablename__ = 'Schedule'
    Id = Column(Integer, primary_key=True)
    Name = Column(String(20), nullable=False)
    StartDate = Column(Integer, nullable=False)
    EndDate = Column(Integer, nullable=False)
    StartDate = Column(Time, nullable=False)
    EndDate = Column(Time, nullable=False)
    IsEachWeek = Column(Boolean, nullable=False)
    Rules = relationship('Rule', secondary=Rule_Schedule, back_populates='Schedules')


class Rule(db.Model):
    __tablename__ = 'Rule'
    Id = Column(String(10), primary_key=True)
    RuleTypeId = Column('RuleTypeId', Integer, ForeignKey('RuleType.Id'), nullable=False)
    RuleType = relationship('RuleType', back_populates="Rules")
    RuleLevel = Column(Integer, nullable=False, default=3)
    Plan = Column(String(1000))
    IsActive = Column(Boolean, nullable=False, default=False)
    Schedules = relationship('Schedule', secondary=Rule_Schedule, back_populates='Rules')
    __mapper_args__ = {
        'polymorphic_identity': RuleTypeId
    }


class RuleParameter1002(Rule):
    __tablename__ = 'RuleParameter1002'
    Id = Column(String, ForeignKey('Rule.Id'), primary_key=True)
    Sensitivity = Column(Integer, nullable=False, default=5)


class RuleParameter2003(Rule):
    __tablename__ = 'RuleParameter2003'
    Id = Column(String, ForeignKey('Rule.Id'), primary_key=True)
    RuleDelay = Column(Integer, nullable=False, default=5)
    Sensitivity = Column(Integer, nullable=False, default=5)


class RuleParameter2004(Rule):
    __tablename__ = 'RuleParameter2004'
    Id = Column(String, ForeignKey('Rule.Id'), primary_key=True)
    DrawType = Column(String(50), nullable=False, default='AreaOfInterestEventDefinition')
    Direction = Column(String(20), nullable=False, default='Ground')
    Classification = Column(String(20), nullable=False, default='Human')
    Points = Column(String(1000), nullable=False,
                    default='(0.7897727272727273, 0.003472222222222222),(0, 0.6736111111111112),(0.21306818181818182, 0.9895833333333334),(0.7982954545454546, 0.9548611111111112)')
    MinFilterNearX = Column(Numeric, nullable=False, default=0.3977272727272727)
    MinFilterNearY = Column(Numeric, nullable=False, default=0.5486111111111112)
    MinFilterNearWidth = Column(Numeric, nullable=False, default=0.2)
    MinFilterNearHeight = Column(Numeric, nullable=False, default=0.3)
    MinFilterFarX = Column(Numeric, nullable=False, default=0.42045454545454547)
    MinFilterFarY = Column(Numeric, nullable=False, default=0.2673611111111111)
    MinFilterFarWidth = Column(Numeric, nullable=False, default=0.1333)
    MinFilterFarHeight = Column(Numeric, nullable=False, default=0.2)
    MaxFilterNearX = Column(Numeric, nullable=False, default=0.6420454545454546)
    MaxFilterNearY = Column(Numeric, nullable=False, default=0.4340277777777778)
    MaxFilterNearWidth = Column(Numeric, nullable=False, default=0.21427685961477277)
    MaxFilterNearHeight = Column(Numeric, nullable=False, default=0.32175541142154773)
    MaxFilterFarX = Column(Numeric, nullable=False, default=0.2869318181818182)
    MaxFilterFarY = Column(Numeric, nullable=False, default=0.25)
    MaxFilterFarWidth = Column(Numeric, nullable=False, default=0.14772727272727273)
    MaxFilterFarHeight = Column(Numeric, nullable=False, default=0.2222222222222222)
    FastenerDrawType = Column(String(50), nullable=False, default='TripwireEventDefinition')
    FastenerDirection = Column(String(20), nullable=False, default='LeftToRight')
    FastenerClassification = Column(String(20), nullable=False, default='Human')
    FastenerPoints = Column(String(1000), nullable=False,
                            default='(0.3096590909090909, 0.22569444444444445),(0.4772727272727273, 0.6701388888888888),(0.48295454545454547, 0.2465277777777778)')
    FastenerMinFilterNearX = Column(Numeric, nullable=False, default=0.3977272727272727)
    FastenerMinFilterNearY = Column(Numeric, nullable=False, default=0.5486111111111112)
    FastenerMinFilterNearWidth = Column(Numeric, nullable=False, default=0.2)
    FastenerMinFilterNearHeight = Column(Numeric, nullable=False, default=0.3)
    FastenerMinFilterFarX = Column(Numeric, nullable=False, default=0.01)
    FastenerMinFilterFarY = Column(Numeric, nullable=False, default=0.01)
    FastenerMinFilterFarWidth = Column(Numeric, nullable=False, default=0.001)
    FastenerMinFilterFarHeight = Column(Numeric, nullable=False, default=0.001)


class RuleParameter2005(Rule):
    __tablename__ = 'RuleParameter2005'
    Id = Column(String, ForeignKey('Rule.Id'), primary_key=True)
    RuleDelay = Column(Integer, nullable=False, default=3)
    Sensitivity = Column(Integer, nullable=False, default=5)


'''
class RuleParameter2008(Rule):
    __tablename__ = 'RuleParameter2008'
    Id = Column(String, ForeignKey('Rule.Id'), primary_key=True)
    DrawType = Column(String(50), nullable=False, default='AreaOfInterestEventDefinition')
    Direction = Column(String(20), nullable=False, default='Ground')
    Classification = Column(String(20), nullable=False, default='Anything')
    Points = Column(String(1000), nullable=False,
                    default='(0.4431818181818182, 0.4201388888888889),(0.42613636363636364, 0.8715277777777778),(0.7926136363636363, 0.875),(0.8210227272727273, 0.4583333333333333)')
    RuleDelay = Column(Integer, default=3)
'''


class RuleParameter2009(Rule):
    __tablename__ = 'RuleParameter2009'
    Id = Column(String, ForeignKey('Rule.Id'), primary_key=True)
    Sensitivity = Column(Integer, nullable=False, default=5)


class RuleParameter2011(Rule):
    __tablename__ = 'RuleParameter2011'
    Id = Column(String, ForeignKey('Rule.Id'), primary_key=True)
    DrawType = Column(String(50), nullable=False, default='AreaOfInterestEventDefinition')
    Direction = Column(String(20), nullable=False, default='Ground')
    Classification = Column(String(20), nullable=False, default='Anything')
    Points = Column(String(1000), nullable=False,
                    default='(0.4431818181818182, 0.4201388888888889),(0.42613636363636364, 0.8715277777777778),(0.7926136363636363, 0.875),(0.8210227272727273, 0.4583333333333333)')
    RuleDelay = Column(Integer, nullable=False, default=3)


'''
class RuleParameter2016(Rule):
    __tablename__ = 'RuleParameter2016'
    Id = Column(String, ForeignKey('Rule.Id'), primary_key=True)
    DrawType = Column(String(50), nullable=False, default='AreaOfInterestEventDefinition')
    Direction = Column(String(20), nullable=False, default='Ground')
    Classification = Column(String(20), nullable=False, default='Anything')
    Points = Column(String(1000), nullable=False,
                    default='(0.4431818181818182, 0.4201388888888889),(0.42613636363636364, 0.8715277777777778),(0.7926136363636363, 0.875),(0.8210227272727273, 0.4583333333333333)')
    RuleDelay = Column(Integer, nullable=False, default=3)
'''


class RuleParameter2017(Rule):
    __tablename__ = 'RuleParameter2017'
    Id = Column(String, ForeignKey('Rule.Id'), primary_key=True)
    RuleDelay = Column(Integer, nullable=False, default=3)


class RuleParameter2018(Rule):
    __tablename__ = 'RuleParameter2018'
    Id = Column(String, ForeignKey('Rule.Id'), primary_key=True)
    DrawType = Column(String(50), nullable=False, default='AreaOfInterestEventDefinition')
    Direction = Column(String(20), nullable=False, default='Ground')
    Classification = Column(String(20), nullable=False, default='Anything')
    Points = Column(String(1000), nullable=False,
                    default='(0.7897727272727273, 0.003472222222222222),(0, 0.6736111111111112),(0.21306818181818182, 0.9895833333333334),(0.7982954545454546, 0.9548611111111112)')
    Sensitivity = Column(Integer, nullable=False, default=5)


class RuleParameter2119(Rule):
    __tablename__ = 'RuleParameter2119'
    Id = Column(String, ForeignKey('Rule.Id'), primary_key=True)
    RuleDelay = Column(Integer, nullable=False, default=5)
    Height = Column(Integer, nullable=False, default=50)


'''
class Alert(db.Model):
    __tablename__ = 'Alert'
    Id = Column(String(20), primary_key=True)
    AlertTime = Column(DateTime)
    RuleTypeId = Column(Integer, ForeignKey('RuleType.Id'))
    RuleType = relationship('RuleType')
    RuleId = Column(String(10), ForeignKey(Rule.Id))
    Rule = relationship('Rule')
    AlertData = relationship('AlertData',uselist=False,back_populates="Alert")


class AlertData(db.Model):
    __tablename__ = 'AlertData'
    AlertId = Column(String(20), ForeignKey('Alert.Id'), primary_key=True)
    Data = Column(LargeBinary)
    Alert = relationship('Alert',back_populates="AlertData")
'''


'''
# 初始化数据库:
db.create_all()
# 插入规则类型数据
db.session.add(RuleType(Id=1002, Name=u'异常行为', Description=u'发现超出常规的行为'))
db.session.add(RuleType(Id=2003, Name=u'尾随进入', Description=u'尾随进入取款区'))
db.session.add(RuleType(Id=2004, Name=u'人员进入', Description=u'人员进入'))
db.session.add(RuleType(Id=2005, Name=u'强行推入', Description=u'发现推入行为'))
db.session.add(RuleType(Id=2009, Name=u'高频尖叫', Description=u'声音异常检测'))
db.session.add(RuleType(Id=2011, Name=u'粘贴广告', Description=u'粘贴广告'))
db.session.add(RuleType(Id=2017, Name=u'超时滞留', Description=u'超时滞留'))
db.session.add(RuleType(Id=2018, Name=u'人员纵火', Description=u'人员纵火'))
db.session.add(RuleType(Id=2101, Name=u'尾随抢劫', Description=u'尾随打斗'))
db.session.add(RuleType(Id=2103, Name=u'推入抢劫', Description=u'推入打斗'))
db.session.add(RuleType(Id=2105, Name=u'疑似破坏', Description=u'猛力敲砸ATM'))
db.session.add(RuleType(Id=2106, Name=u'疑似打斗', Description=u'疑似打斗'))
db.session.add(RuleType(Id=2119, Name=u'人员下蹲检测', Description=u'人员下蹲检测'))

# 插入规则数据
db.session.add(RuleParameter1002(Id='10020101', RuleTypeId=1002))
db.session.add(RuleParameter2003(Id='20030101', RuleTypeId=2003))
db.session.add(RuleParameter2004(Id='20040101', RuleTypeId=2004))
db.session.add(RuleParameter2005(Id='20050101', RuleTypeId=2005))
db.session.add(RuleParameter2009(Id='20090101', RuleTypeId=2009))
db.session.add(RuleParameter2011(Id='20110101', RuleTypeId=2011))
db.session.add(RuleParameter2017(Id='20170101', RuleTypeId=2017))
db.session.add(RuleParameter2018(Id='20180101', RuleTypeId=2018))
db.session.add(RuleParameter2119(Id='21190101', RuleTypeId=2119))
db.session.add(Rule(Id='21010101', RuleTypeId=2101))
db.session.add(Rule(Id='21030101', RuleTypeId=2103))
db.session.add(Rule(Id='21050101', RuleTypeId=2105))
db.session.add(Rule(Id='21060101', RuleTypeId=2106))

#插入报警数据
# img_file=open(u'f:/Mac/项目/人员出入/UserSynchronizeComponent.zip')
# filedata=img_file.read()
# img_file.close()
# filedata2 = bytearray(filedata)
# db.session.add(Alert(Id='2017071806872145', RuleTypeId=2106,RuleId='20160101',AlertTime=datetime.datetime.now(),AlertData=AlertData(Data=filedata)))
# db.session.add(Alert(Id='2017071811870343', RuleTypeId=2005,RuleId='20050101',AlertTime=datetime.datetime.now(),AlertData=AlertData(Data=filedata)))
# 提交
db.session.commit()
'''