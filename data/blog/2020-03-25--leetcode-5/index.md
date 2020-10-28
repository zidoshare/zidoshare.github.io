---
title: leetcode顺序刷题记录-5-最长回文子串
tags:
  - leetcode
  - 算法
  - learning
createdDate: '2020-03-25'
updatedDate: '2020-03-25'
draft: false
origin: true
image: header.png
---

```c
/*
 * @lc app=leetcode id=5 lang=c
 *
 * [5] Longest Palindromic Substring
 *
 * https://leetcode.com/problems/longest-palindromic-substring/description/
 *
 * algorithms
 * Medium (28.89%)
 * Total Accepted:    839.8K
 * Total Submissions: 2.9M
 * Testcase Example:  '"babad"'
 *
 * Given a string s, find the longest palindromic substring in s. You may
 * assume that the maximum length of s is 1000.
 * 
 * Example 1:
 * 
 * 
 * Input: "babad"
 * Output: "bab"
 * Note: "aba" is also a valid answer.
 * 
 * 
 * Example 2:
 * 
 * 
 * Input: "cbbd"
 * Output: "bb"
 * 
 * 
 */
#include <string.h>
#include <malloc.h>

char *longestPalindrome(char *s)
{
  int i = 0;
  if (*s == '\0')
  {
    return "";
  }
  int max = 1, start = 0;
  for (; *(s + i) != '\0'; i++)
  {
    int j = 1, len = 1;
    for (; i - j >= 0 && *(s + i + j) != '\0'; j++)
    {
      if (*(s + i - j) == *(s + i + j))
      {
        len += 2;
      }
      else
      {
        break;
      }
    }
    if (len > max)
    {
      max = len;
      start = i - j + 1;
    }
    for (len = 0, j = 0; i - j >= 0 && *(s + i + j + 1) != '\0'; j++)
    {
      if (*(s + i - j) == *(s + i + j + 1))
      {
        len += 2;
      }
      else
      {
        break;
      }
    }
    if (len > max)
    {
      max = len;
      start = i - j + 1;
    }
  }
  char *result = (char *)malloc(sizeof(char) * (max + 1));
  *(result + max) = '\0';
  strncpy(result, s + start, max);
  return result;
}

```