---
title: leetcode顺序刷题记录-3-无重复字符的最长子串  
tags:
  - leetcode
  - 算法
  - learning
createdDate: '2020-03-23'
updatedDate: '2020-03-23'
draft: false
origin: true
image: header.png
---

```c
/*
 * [3] Longest Substring Without Repeating Characters
 *
 * https://leetcode.com/problems/longest-substring-without-repeating-characters/description/
 *
 * algorithms
 * Medium (24.68%)
 * Total Accepted:    468.1K
 * Total Submissions: 1.9M
 * Testcase Example:  '"abcabcbb"'
 *
 * Given a string, find the length of the longest substring without repeating
 * characters.
 * 
 * Examples:
 * 
 * Given "abcabcbb", the answer is "abc", which the length is 3.
 * 
 * Given "bbbbb", the answer is "b", with the length of 1.
 * 
 * Given "pwwkew", the answer is "wke", with the length of 3. Note that the
 * answer must be a substring, "pwke" is a subsequence and not a substring.
 */
#include <stdio.h>
#include <memory.h>
int lengthOfLongestSubstring(char *s)
{
  if (*s == '\0')
    return 0;
  int i = 0, j = 0, len = 0, max = 0;
  int set[128];
  for (; j < 128; j++)
    set[j] = -1;
  while (*(s + i) != '\0')
  {
    int index = *(s + i);
    if (set[index] != -1 && set[index] >= i - len)
      len = i - set[index] - 1;
    set[index] = i;
    len++;
    if (len > max)
      max = len;
    i++;
  }
  return max;
}
```