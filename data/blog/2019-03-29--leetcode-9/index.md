---
title: leetcode顺序刷题记录-9-回文数
tags:
  - leetcode
  - 算法
  - learning
createdDate: '2019-03-29'
updatedDate: '2019-03-29'
draft: false
origin: true
image: header.png
---

```c
/*
 * @lc app=leetcode.cn id=9 lang=c
 *
 * [9] 回文数
 *
 * https://leetcode-cn.com/problems/palindrome-number/description/
 *
 * algorithms
 * Easy (57.28%)
 * Likes:    985
 * Dislikes: 0
 * Total Accepted:    287.2K
 * Total Submissions: 501.4K
 * Testcase Example:  '121'
 *
 * 判断一个整数是否是回文数。回文数是指正序（从左向右）和倒序（从右向左）读都是一样的整数。
 * 
 * 示例 1:
 * 
 * 输入: 121
 * 输出: true
 * 
 * 
 * 示例 2:
 * 
 * 输入: -121
 * 输出: false
 * 解释: 从左向右读, 为 -121 。 从右向左读, 为 121- 。因此它不是一个回文数。
 * 
 * 
 * 示例 3:
 * 
 * 输入: 10
 * 输出: false
 * 解释: 从右向左读, 为 01 。因此它不是一个回文数。
 * 
 * 
 * 进阶:
 * 
 * 你能不将整数转为字符串来解决这个问题吗？
 * 
 */

// @lc code=start

#include <stdbool.h>
bool isPalindrome(int x)
{
    if (x < 0)
    {
        return false;
    }
    if (x < 10)
    {
        return true;
    }
    else if (x % 10 == 0)
    {
        return false;
    }
    else
    {
        int tmp = 0;
        while (x)
        {
            tmp = tmp * 10 + x % 10;
            x = x / 10;
            if (tmp > x)
            {
                break;
            }
            if (tmp == x)
            {
                return true;
            }
            if (x / 10 == tmp)
            {
                return true;
            }
        }
    }
    return false;
}

// @lc code=end

```