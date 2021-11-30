---
title: linux 的终端和伪终端
createdDate: "2021-09-27"
updatedDate: "2021-09-27"
tags:
  - containers
  - linux
origin: true
draft: true
---

# TTY 概述

什么是 tty?

在 Linux 中大概有三种包含 tty 的东西，分别如下：

## tty 命令


Linux 有一个名为 `tty` 的内置命令，如果我们执行一下，大概会看到这样的输出（注意不同的电脑输出可能不一样）：

```shell
# tty
/dev/pts/0
```
它的作用是打印当前你正在使用的 terminal 的名称。如果我们此时再开一个新的终端，再执行此命令，会发现输出变了，一般是 `/dev/pts/1`，可以看出我们每打开一个终端，都会有不同的 tty 设备名去对应。

## tty 设备

它位于 /dev/tty。是一个字符设备，它的设备号是 `5 0`,我们可以通过`cat /proc/devices | grep /dev/tty`看到，提到字符设备，我们就应该知道这意味着我们可以向其中顺序写入数据。

```shell
# echo 'hello world' > /dev/tty
hello world
```

可以发现，当我们向 /dev/tty 写入数据时，又直接输出到了当前的控制台。如果我们打开一个新的终端，再去执行一下此命令，又会打印到新的控制台中，而原控制台没有任何变化，这说明，**/dev/tty 总是将输入流打印到当前控制台**。

## 控制终端

tty 源于 `teletype` 或者 `teletypewriters`，翻译过来就是电传打字机，它的历史非常的冗长，如果你感兴趣，可以参考这篇文章，讲解得非常详细：<http://www.linusakesson.net/programming/tty/index.php>。总结来讲就是以前的 tty 是指一个专门用来连接的硬件设备，一端输入，一端输出。后来有了计算机，就用 tty 来连接计算机以执行指令。

现代的 tty 应该是指控制终端（controlling terminal），它不再是一个专门的硬件设备，而是一个模拟软件。这也就是我们今天要讲的重头戏了。

# 终端定义

