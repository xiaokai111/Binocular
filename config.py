#!/usr/bin/python2.7
# -*- coding: utf-8 -*-
import os
basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = ''  # 填入密钥
    SQLALCHEMY_COMMIT_ON_TEARDOWN = True
    SQLALCHEMY_TRACK_MODIFICATIONS = True

    @staticmethod
    def init_app(app):
        pass


class DevelopmentConfig(Config):
    debug = True
    SQLALCHEMY_DATABASE_URI = r'sqlite:///' + os.path.join(basedir, 'data//data.hsdb')
    print(SQLALCHEMY_DATABASE_URI)
    SQLALCHEMY_TRACK_MODIFICATIONS = True
    #启用跨站请求攻击保护
    CSRF_ENABLED = True
    SECRET_KEY='jkfdkfdkadlkfsakfdsfkdskfsak'

class ProduceConfig(Config):
    pass


config = {
    'default': DevelopmentConfig
}