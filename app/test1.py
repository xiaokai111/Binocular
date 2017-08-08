#!/usr/bin/python2.7
# -*- coding: utf-8 -*-
'''
@author: rabbit

@contact: 739462304@qq.com

@time: 2017/7/12 13:47

@desc:对千库网图片素材收费进行了破解

'''

from PIL import Image


# 输入网址，爬取图片，透明化图片，保存

def transPNG(srcImageName, dstImageName):
    '''
    对待处理图片背景进行透明化
    :param srcImageName:待处理图片
    :param dstImageName:处理后的图片
    :return:无返回
    '''
    img = Image.open(srcImageName)
    img = img.convert("RGBA")
    datas = img.getdata()
    newData = list()
    for item in datas:
        if item[0] > 220 and item[1] > 220 and item[2] > 220:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    img.putdata(newData)
    img.save(dstImageName, "PNG")

if __name__ == '__main__':
    transPNG(r"C:\Users\HS\Desktop\111.jpg", "apple2.png")