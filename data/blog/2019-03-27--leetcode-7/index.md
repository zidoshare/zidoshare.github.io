---
title: leetcode顺序刷题记录-7-整数反转
tags:
  - leetcode
  - 算法
  - learning
createdDate: '2019-03-27'
updatedDate: '2019-03-27'
draft: false
origin: true
image: header.png
---

```c
/*
 * @lc app=leetcode id=7 lang=c
 *
 * [7] Reverse Integer
 *
 * https://leetcode.com/problems/reverse-integer/description/
 *
 * algorithms
 * Easy (25.63%)
 * Total Accepted:    1M
 * Total Submissions: 3.9M
 * Testcase Example:  '123'
 *
 * Given a 32-bit signed integer, reverse digits of an integer.
 * 
 * Example 1:
 * 
 * 
 * Input: 123
 * Output: 321
 * 
 * 
 * Example 2:
 * 
 * 
 * Input: -123
 * Output: -321
 * 
 * 
 * Example 3:
 * 
 * 
 * Input: 120
 * Output: 21
 * 
 * 
 * Note:
 * Assume we are dealing with an environment which could only store integers
 * within the 32-bit signed integer range: [−2^31,  2^31 − 1]. For the purpose
 * of this problem, assume that your function returns 0 when the reversed
 * integer overflows.
 * 
 */

int reverse(int x)
{
  long result = 0;
  while (x)
  {
    result = result * 10 + x % 10;
    x = x / 10;
  }
  if (result > 0x7fffffff || result < (signed int)0x80000000)
  {
    return 0;
  }
  return result;
}

```