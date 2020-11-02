---
title: leetcode顺序刷题记录-14-最长公共前缀
tags:
  - leetcode
  - 算法
  - learning
createdDate: '2019-05-02'
updatedDate: '2019-05-02'
draft: false
origin: true
image: header.png
---


```c
/*
 * @lc app=leetcode.cn id=14 lang=c
 *
 * [14] 最长公共前缀
 *
 * https://leetcode-cn.com/problems/longest-common-prefix/description/
 *
 * algorithms
 * Easy (37.99%)
 * Likes:    1094
 * Dislikes: 0
 * Total Accepted:    288.7K
 * Total Submissions: 754.6K
 * Testcase Example:  '["flower","flow","flight"]'
 *
 * 编写一个函数来查找字符串数组中的最长公共前缀。
 * 
 * 如果不存在公共前缀，返回空字符串 ""。
 * 
 * 示例 1:
 * 
 * 输入: ["flower","flow","flight"]
 * 输出: "fl"
 * 
 * 
 * 示例 2:
 * 
 * 输入: ["dog","racecar","car"]
 * 输出: ""
 * 解释: 输入不存在公共前缀。
 * 
 * 
 * 说明:
 * 
 * 所有输入只包含小写字母 a-z 。
 * 
 */

// @lc code=start
#include <string.h>
#include <stdlib.h>
char *longestCommonPrefix(char **strs, int strsSize)
{
    if (strsSize == 0)
    {
        return "";
    }
    for (int i = 0;; i++)
    {
        if (strs[0][i] == '\0')
        {
            return strs[0];
        }
        char c = strs[0][i];
        for (int j = 1; j < strsSize; j++)
        {
            if (strs[j][i] == '\0' || strs[j][i] != c)
            {
                char *result = (char *)malloc((i + 1) * sizeof(char));
                result = strncpy(result, strs[0], i);
                result[i] = '\0';
                return result;
            }
        }
    }
    return "";
}
// @lc code=end

```