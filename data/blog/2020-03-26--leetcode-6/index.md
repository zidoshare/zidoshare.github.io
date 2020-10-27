---
title: leetcode顺序刷题记录-6-Z字形变换
tags:
  - leetcode
  - 算法
  - learning
createdDate: '2020-03-26'
updatedDate: '2020-03-26'
draft: false
origin: true
image: header.png
---

```c
/*
 * @lc app=leetcode id=6 lang=c
 *
 * [6] ZigZag Conversion
 *
 * https://leetcode.com/problems/zigzag-conversion/description/
 *
 * algorithms
 * Medium (35.04%)
 * Total Accepted:    424.1K
 * Total Submissions: 1.2M
 * Testcase Example:  '"PAYPALISHIRING"\n3'
 *
 * The string "PAYPALISHIRING" is written in a zigzag pattern on a given number
 * of rows like this: (you may want to display this pattern in a fixed font for
 * better legibility)
 * 
 * 
 * P   A   H   N
 * A P L S I I G
 * Y   I   R
 * 
 * 
 * And then read line by line: "PAHNAPLSIIGYIR"
 * 
 * Write the code that will take a string and make this conversion given a
 * number of rows:
 * 
 * 
 * string convert(string s, int numRows);
 * 
 * Example 1:
 * 
 * 
 * Input: s = "PAYPALISHIRING", numRows = 3
 * Output: "PAHNAPLSIIGYIR"
 * 
 * 
 * Example 2:
 * 
 * 
 * Input: s = "PAYPALISHIRING", numRows = 4
 * Output: "PINALSIGYAHRPI"
 * Explanation:
 * 
 * P     I    N
 * A   L S  I G
 * Y A   H R
 * P     I
 * 
 */

#include <malloc.h>
#include <string.h>
char *convert(char *s, int numRows)
{
  if (numRows == 1)
  {
    return s;
  }
  int len = strlen(s);
  char *result = (char *)malloc(sizeof(char) * (len + 1));
  result[len] = '\0';
  int i = 0, index = 0;
  for (; i < numRows; i++)
  {
    int j = 0;
    while (1)
    {
      if (i < numRows - 1)
      {
        int target = i + 2 * (numRows - 1) * j;
        if (target < len)
        {
          result[index++] = s[target];
        }
        else
        {
          break;
        }
      }
      if (i > 0)
      {
        int target = (j + 1) * (2 * (numRows - 1)) - i;
        if (target < len)
        {
          result[index++] = s[target];
        }
        else
        {
          break;
        }
      }
      j++;
    }
  }
  return result;
}

```