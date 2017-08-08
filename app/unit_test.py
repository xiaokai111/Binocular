#!/usr/bin/python2.7
# -*- coding: utf-8 -*-
'''
@author: rabbit

@contact: 739462304@qq.com

@time: 2017/6/30 10:25

@desc:UnitTest

'''
import unittest

from config import basedir
from app import app
from app.models import User,db
from dataaccess import find_user
import  os

class TestCase(unittest.TestCase):
    # 单元测试前执行
    def setUp(self):
        app.config['TESTING'] = True
        app.config['CSRF_ENABLED'] = False
        # path=basedir+'\\data'
        path= 'sqlite:///' + os.path.join(basedir, 'data\\data.hsdb')
        app.config['SQLALCHEMY_DATABASE_URI'] = path
        print(path)
        self.app = app.test_client()
        db.create_all()


    #单元测试后执行
    def tearDown(self):
        db.session.remove()
        db.drop_all()



    def test_avatar(self):
        user= db.session.query(User).filter_by(Name='admin').first()
        assert user==None



if __name__ == '__main__':
    unittest.main()



