---
title: Linux 环境编程的一些记录
createdDate: "2021-10-03"
updatedDate: "2021-10-03"
tags:
  - linux
origin: true
draft: true
---

# 概述

在 Linux 环境编程中，经常会疑惑：

* 动态库文件在哪？
* 动态库里有哪些函数？
* 头文件定义在哪？

等等。

接下来介绍一些在 Linux 编程中经常会用到的一些命令，来帮助编写代码。

# 常见问题和解决方案

## 查看某个 .so 在 Linux 下的路径

```shell
ldconfig -p | grep xxx.so
```

## 查看 .so 库里有些什么函数

```shell
nm -D xxx.so
```

例如我在使用的 libfuse3.so

```shell
# nm -D /lib64/libfuse3.so

0000000000000000 A FUSE_3.0
0000000000000000 A FUSE_3.1
0000000000000000 A FUSE_3.2
0000000000000000 A FUSE_3.3
0000000000000000 A FUSE_3.4
0000000000000000 A FUSE_3.7
                 w _ITM_deregisterTMCloneTable
                 w _ITM_registerTMCloneTable
                 U __assert_fail@@GLIBC_2.2.5
                 w __cxa_finalize@@GLIBC_2.2.5
                 U __errno_location@@GLIBC_2.2.5
                 U __fprintf_chk@@GLIBC_2.3.4
                 w __gmon_start__
                 U __isoc99_sscanf@@GLIBC_2.7
                 U __lxstat64@@GLIBC_2.2.5
                 U __memcpy_chk@@GLIBC_2.3.4
                 U __printf_chk@@GLIBC_2.3.4
                 U __realpath_chk@@GLIBC_2.4
                 U __snprintf_chk@@GLIBC_2.3.4
                 U __sprintf_chk@@GLIBC_2.3.4
                 U __stack_chk_fail@@GLIBC_2.4
                 U __vfprintf_chk@@GLIBC_2.3.4
                 U __xstat64@@GLIBC_2.2.5
                 U _exit@@GLIBC_2.2.5
                 U abort@@GLIBC_2.2.5
                 U access@@GLIBC_2.2.5
                 U calloc@@GLIBC_2.2.5
                 U chdir@@GLIBC_2.2.5
                 U clock_gettime@@GLIBC_2.17
                 U close@@GLIBC_2.2.5
000000000001d380 T cuse_lowlevel_main@@FUSE_3.0
000000000001cbc0 T cuse_lowlevel_new@@FUSE_3.0

还有更多就省略了。。。
```

其中 T 前缀代表函数是导出可用的。 U 代表为函数定义
