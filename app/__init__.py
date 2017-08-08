#!/usr/bin/python2.7
# -*- coding: utf-8 -*-
from flask import Flask
from log_config import log
from config import DevelopmentConfig
import  os
app = Flask(__name__)  # 创建Flask类的实例
app.config.from_object(DevelopmentConfig)  # 从config.py读入配置

baseDir=os.path.abspath('.\\')

# 这个import语句放在这里, 防止views, models import发生循环import
from app import models,views

from communication import calibra_call

# calibra_call.initRuleStatusData()