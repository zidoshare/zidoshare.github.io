---
title: leetcode顺序刷题记录-12-整数转罗马数字
tags:
  - leetcode
  - 算法
  - learning
createdDate: '2019-04-23'
updatedDate: '2019-04-23'
draft: false
origin: true
image: header.png
---


```c
/*
 * @lc app=leetcode.cn id=12 lang=c
 *
 * [12] 整数转罗马数字
 */

// @lc code=start

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
char *intToRoman(int num)
{
    char *c[4][10] = {
        {"", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"},
        {"", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC"},
        {"", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM"},
        {"", "M", "MM", "MMM"}};
    char *result = (char *)malloc(20 * sizeof(char));
    result[0] = '\0';
    strcat(result, c[3][num / 1000]);
    strcat(result, c[2][num / 100 % 10]);
    strcat(result, c[1][num / 10 % 10]);
    strcat(result, c[0][num % 10]);
    return result;
}

// @lc code=end


```