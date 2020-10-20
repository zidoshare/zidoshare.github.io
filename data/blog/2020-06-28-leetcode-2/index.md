---
title: leetcode顺序刷题记录-2-两数相加
tags:
  - leetcode
  - 算法
  - learning
createdDate: '2020-06-28'
updatedDate: '2020-06-28'
draft: false
origin: true
---

```c

没什么好说的。
/*
 * @lc app=leetcode.cn id=2 lang=c
 *
 * [2] 两数相加
 *
 * https://leetcode-cn.com/problems/add-two-numbers/description/
 *
 * algorithms
 * Medium (37.54%)
 * Likes:    4515
 * Dislikes: 0
 * Total Accepted:    459.1K
 * Total Submissions: 1.2M
 * Testcase Example:  '[2,4,3]\n[5,6,4]'
 *
 * 给出两个 非空 的链表用来表示两个非负的整数。其中，它们各自的位数是按照 逆序 的方式存储的，并且它们的每个节点只能存储 一位 数字。
 * 
 * 如果，我们将这两个数相加起来，则会返回一个新的链表来表示它们的和。
 * 
 * 您可以假设除了数字 0 之外，这两个数都不会以 0 开头。
 * 
 * 示例：
 * 
 * 输入：(2 -> 4 -> 3) + (5 -> 6 -> 4)
 * 输出：7 -> 0 -> 8
 * 原因：342 + 465 = 807
 * 
 * 
 */

// @lc code=start
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     struct ListNode *next;
 * };
 */

#include <malloc.h>
struct ListNode *addTwoNumbers(struct ListNode *l1, struct ListNode *l2)
{
  struct ListNode *head = (struct ListNode *)malloc(sizeof(struct ListNode));
  struct ListNode *self = (struct ListNode *)malloc(sizeof(struct ListNode));
  struct ListNode *current = head;
  self->val = 0;
  self->next = NULL;
  struct ListNode *n1 = l1;
  struct ListNode *n2 = l2;
  int carry = 0;
  while (current != NULL)
  {
    current->val = n1->val + n2->val + carry;
    carry = 0;
    if (current->val >= 10)
    {
      current->val = current->val % 10;
      carry = 1;
    }
    n1 = (n1->next == NULL ? self : n1->next);
    n2 = (n2->next == NULL ? self : n2->next);
    if (n1 == self && n2 == self)
    {
      if (carry == 1)
      {
        current = current->next = (struct ListNode *)malloc(sizeof(struct ListNode));
        current->val = 1;
        current->next = NULL;
      }
      break;
    }
    else
    {
      current = current->next = (struct ListNode *)malloc(sizeof(struct ListNode));
      current->next = NULL;
    }
  }
  return head;
}
// @lc code=end
```