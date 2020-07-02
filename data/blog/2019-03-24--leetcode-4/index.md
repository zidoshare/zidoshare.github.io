---
title: leetcode顺序刷题记录-4-寻找两个正序数组的中位数  
tags:
  - leetcode
  - 算法
  - learning
createdDate: '2019-03-24'
updatedDate: '2019-03-24'
draft: false
origin: true
image: header.png
---

```c
/*
 * @lc app=leetcode id=4 lang=c
 *
 * [4] Median of Two Sorted Arrays
 *
 * https://leetcode.com/problems/median-of-two-sorted-arrays/description/
 *
 * algorithms
 * Hard (28.59%)
 * Total Accepted:    619.9K
 * Total Submissions: 2.2M
 * Testcase Example:  '[1,3]\n[2]'
 *
 * There are two sorted arrays nums1 and nums2 of size m and n respectively.
 * 
 * Find the median of the two sorted arrays. The overall run time complexity
 * should be O(log (m+n)).
 * 
 * You may assume nums1 and nums2 cannot be both empty.
 * 
 * Example 1:
 * 
 * 
 * nums1 = [1, 3]
 * nums2 = [2]
 * 
 * The median is 2.0
 * 
 * 
 * Example 2:
 * 
 * 
 * nums1 = [1, 2]
 * nums2 = [3, 4]
 * 
 * The median is (2 + 3)/2 = 2.5
 * 
 * 
 */

#include <malloc.h>
double findMedianSortedArrays(int *nums1, int nums1Size, int *nums2, int nums2Size)
{
  int *arr = (int *)malloc(sizeof(int) * (nums1Size + nums2Size));
  int index = 0, size = nums1Size + nums2Size, i = 0, j = 0;
  for (; index < size; index++)
  {
    if (j >= nums2Size || (i < nums1Size && nums1[i] < nums2[j]))
    {
      arr[index] = nums1[i++];
    }
    else
    {
      arr[index] = nums2[j++];
    }
  }
  if (index % 2 == 0)
  {
    return (arr[index / 2 - 1] + arr[index / 2]) / 2.0;
  }
  else
  {
    return arr[(index) / 2];
  }
}

```