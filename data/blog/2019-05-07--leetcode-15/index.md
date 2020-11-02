---
title: leetcode顺序刷题记录-15-三数之和
tags:
  - leetcode
  - 算法
  - learning
createdDate: '2019-05-07'
updatedDate: '2019-05-07'
draft: false
origin: true
image: header.png
---


```c
/*
 * @lc app=leetcode.cn id=15 lang=c
 *
 * [15] 三数之和
 *
 * https://leetcode-cn.com/problems/3sum/description/
 *
 * algorithms
 * Medium (28.07%)
 * Likes:    2288
 * Dislikes: 0
 * Total Accepted:    255.2K
 * Total Submissions: 908.9K
 * Testcase Example:  '[-1,0,1,2,-1,-4]'
 *
 * 给你一个包含 n 个整数的数组 nums，判断 nums 中是否存在三个元素 a，b，c ，使得 a + b + c = 0
 * ？请你找出所有满足条件且不重复的三元组。
 * 
 * 注意：答案中不可以包含重复的三元组。
 * 
 * 
 * 
 * 示例：
 * 
 * 给定数组 nums = [-1, 0, 1, 2, -1, -4]，
 * 
 * 满足要求的三元组集合为：
 * [
 * ⁠ [-1, 0, 1],
 * ⁠ [-1, -1, 2]
 * ]
 * 
 * 
 */

// @lc code=start

/**
 * Return an array of arrays of size *returnSize.
 * The sizes of the arrays are returned as *returnColumnSizes array.
 * Note: Both returned array and *columnSizes array must be malloced, assume caller calls free().
 */

#define NULL 0
int comp(const void *a, const void *b)
{
    return *(int *)a - *(int *)b;
}

int **threeSum(int *nums, int numsSize, int *returnSize, int **returnColumnSizes)
{
    if (numsSize < 3)
    {
        return NULL;
    }
    int index = 0;
    int i = 0;
    int **result = (int **)malloc(numsSize * 3 * sizeof(int *));
    *returnColumnSizes = (int *)malloc(numsSize * sizeof(int *));
    int low;
    int high;
    qsort(nums, numsSize, sizeof(nums[0]), comp);

    for (i = 0; i < numsSize; i++)
    {
        if (nums[i] > 0)
        {
            break;
        }

        if (i > 0 && nums[i] == nums[i - 1])
        {
            continue;
        }

        low = i + 1;
        high = numsSize - 1;

        while (low < high)
        {
            int sum = nums[i] + nums[low] + nums[high];

            if (sum == 0)
            {
                result[index] = (int *)calloc(3, sizeof(int));

                result[index][0] = nums[i];
                result[index][1] = nums[low];
                result[index][2] = nums[high];
                index++;

                while (low < high && nums[low] == nums[low + 1])
                {
                    low++;
                }
                while (low < high && nums[high] == nums[high - 1])
                {
                    high--;
                }

                low++;
                high--;
            }
            else if (sum < 0)
            {
                low++;
            }
            else if (sum > 0)
            {
                high--;
            }
        }
    }

    for (i = 0; i < index; i++)
    {
        (*returnColumnSizes)[i] = 3;
    }
    *returnSize = index;

    return result;
}
// @lc code=end

```