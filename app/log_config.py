#!/usr/bin/python2.7
# -*- coding: utf-8 -*-
import logging
from logging.handlers import TimedRotatingFileHandler
import re
import os

from logging.handlers import RotatingFileHandler

logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s %(filename)s [line:%(lineno)d] %(levelname)s %(message)s',
                    datefmt='%a, %d %b %Y %H:%M:%S',
                    filemode='w')
__curpath__ = os.path.abspath('.\\logs')
__curpath__ = __curpath__ + "\\"


def log_init():
    log_fmt = '%(asctime)s\tFile \"%(filename)s\",line %(lineno)s\t%(levelname)s: %(message)s'
    formatter = logging.Formatter(log_fmt)
    log_file_handler = TimedRotatingFileHandler(filename=__curpath__ + "syslog", when="D", interval=1, backupCount=7)
    log_file_handler.suffix = "%Y%m%d.log"
    log_file_handler.extMatch = re.compile(r"^\d{4}\d{2}\d{2}.log$")
    log_file_handler.setFormatter(formatter)
    log_file_handler.setLevel(logging.DEBUG)
    log = logging.getLogger()
    log.addHandler(log_file_handler)
    return log


log = log_init()
