---
title: leetcode顺序刷题记录-16-最接近的三数之和
tags:
  - leetcode
  - 算法
  - learning
createdDate: '2019-05-08'
updatedDate: '2019-05-08'
draft: false
origin: true
image: header.png
---


```c
/*
 * @lc app=leetcode.cn id=16 lang=c
 *
 * [16] 最接近的三数之和
 *
 * https://leetcode-cn.com/problems/3sum-closest/description/
 *
 * algorithms
 * Medium (44.28%)
 * Likes:    449
 * Dislikes: 0
 * Total Accepted:    108.9K
 * Total Submissions: 245.8K
 * Testcase Example:  '[-1,2,1,-4]\n1'
 *
 * 给定一个包括 n 个整数的数组 nums 和 一个目标值 target。找出 nums 中的三个整数，使得它们的和与 target
 * 最接近。返回这三个数的和。假定每组输入只存在唯一答案。
 * 
 * 
 * 
 * 示例：
 * 
 * 输入：nums = [-1,2,1,-4], target = 1
 * 输出：2
 * 解释：与 target 最接近的和是 2 (-1 + 2 + 1 = 2) 。
 * 
 * 
 * 
 * 
 * 提示：
 * 
 * 
 * 3 <= nums.length <= 10^3
 * -10^3 <= nums[i] <= 10^3
 * -10^4 <= target <= 10^4
 * 
 * 
 */

// @lc code=start

#include <stdio.h>
#include <stdlib.h>
int comp(const void *a, const void *b)
{
    return *(int *)a - *(int *)b;
}

int threeSumClosest(int *nums, int numsSize, int target)
{
    int result[3];
    int min_diff = 0x7fffffff;
    qsort(nums, numsSize, sizeof(int), comp);
    int cur = 0;
    for (cur = 0; cur < numsSize - 2; cur++)
    {
        int low, high;
        int point = target - nums[cur];
        low = cur + 1;
        high = numsSize - 1;
        while (low < high)
        {
            int diff = point - nums[low] - nums[high];
            if (diff > 0)
            {
                low += 1;
            }
            else if (diff < 0)
            {
                high -= 1;
            }
            else
            {
                return target;
            }
            if (abs(diff) < abs(min_diff))
            {
                min_diff = diff;
            }
        }
    }
    return target - min_diff;
}
// @lc code=end

```