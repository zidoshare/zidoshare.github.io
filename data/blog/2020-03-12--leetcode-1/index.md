---
title: leetcode顺序刷题记录-1-两数之和
tags:
  - leetcode
  - 算法
  - learning
createdDate: '2020-03-12'
updatedDate: '2020-03-12'
draft: false
origin: true
image: header.png
---

没什么好说的。

```c
/*
 * @lc app=leetcode.cn id=1 lang=c
 *
 * [1] 两数之和
 *
 * https://leetcode-cn.com/problems/two-sum/description/
 *
 * algorithms
 * Easy (48.70%)
 * Likes:    8507
 * Dislikes: 0
 * Total Accepted:    1.2M
 * Total Submissions: 2.4M
 * Testcase Example:  '[2,7,11,15]\n9'
 *
 * 给定一个整数数组 nums 和一个目标值 target，请你在该数组中找出和为目标值的那 两个 整数，并返回他们的数组下标。
 * 
 * 你可以假设每种输入只会对应一个答案。但是，数组中同一个元素不能使用两遍。
 * 
 * 
 * 
 * 示例:
 * 
 * 给定 nums = [2, 7, 11, 15], target = 9
 * 
 * 因为 nums[0] + nums[1] = 2 + 7 = 9
 * 所以返回 [0, 1]
 * 
 * 
 */

// @lc code=start


/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
#include <malloc.h>
int *twoSum(int *nums, int numsSize, int target)
{
  int *result = (int *)malloc(sizeof(int) * 2);
  int i, j;
  for (i = 0; i < numsSize; i++)
  {
    for (j = i + 1; j < numsSize; j++)
    {
      if (nums[i] + nums[j] == target)
      {
        result[0] = i;
        result[1] = j;
        return result;
      }
    }
  }
  return result;
}
// @lc code=end
```