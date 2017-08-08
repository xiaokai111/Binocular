#!/usr/bin/python2.7
# -*- coding: utf-8 -*-

def get_feature(img):
	'''
	获取指定图片的特征值,
	1.
	按照每排的像素点, 高度为10, 则有10个维度, 然后为6列, 总共16个维度
	:param
	img_path:
	:return:一个维度为10（高度）的列表
	:param img: 
	:return: 
	'''
	width, height = img.size
	pixel_cnt_list = []
	height = 10



	for y in range(height):
		pix_cnt_x = 0
		for x in range(width):
			if img.getpixel((x, y)) == 0:  # 黑色点
				pix_cnt_x += 1

		pixel_cnt_list.append(pix_cnt_x)
	for x in range(width):
		pix_cnt_y = 0
		for y in range(height):
			if img.getpixel((x, y)) == 0:  # 黑色点
				pix_cnt_y += 1
		pixel_cnt_list.append(pix_cnt_y)

	return pixel_cnt_list

def train_svm_model():
	pass

