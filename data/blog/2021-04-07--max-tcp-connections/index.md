---
title: 一台 Linux 服务器最多能支撑多少个 TCP 连接
createdDate: "2021-04-07"
updatedDate: "2021-04-07"
tags:
  - linux
  - tcp
origin: true
draft: false
---

# 背景

在一次面试中被问到了，没回答上来，所以回家仔细复盘分析一下

# TCP连接四元组

TCP连接四元组是源IP地址、源端口、目的IP地址和目的端口。任意一个元素发生了改变，那么就代表的是一条完全不同的连接。

例如在服务器配置了nginx，端口是固定使用80，服务器ip固定。剩下源IP地址、源端口是可变的。 所以理论上nginx可以建立2^32 * 2^16个连接，即ip数量*端口数量。

# 文件对象限制

每维持一个TCP连接，都需要创建一个文件对象，而由于linux系统出于安全考虑限制了可打开的打开的文件描述符的数量
> 恶意进程可能会无限创建和打开文件，导致服务器崩溃

linux的限制可分为三个级别：

* 系统级：当前系统可打开的最大数量，通过fs.file-max参数可修改
* 用户级：指定用户可打开的最大数量，修改/etc/security/limits.conf
* 进程级：单个进程可打开的最大数量，通过fs.nr_open参数可修改

# 内存限制

每条TCP连接都需要file、socket等内核对象，一条空的TCP连接大约会消耗3.3KB的内存。

当客户端发送数据时，还需要为TCP内核对象开启`接受缓冲区`，增加内存开销。

接受缓冲区大小可配置，可使用sysctl查看：

```
$ sysctl -a | grep rmem
net.ipv4.tcp_rmem = 4096 87380 8388608
net.core.rmem_default = 212992
net.core.rmem_max = 8388608
```

> tcp_rmem: TCP连接所需分配的最少字节数。默认4K，最大8MB。

TCP分配发送缓存区的大小受参数net.ipv4.tcp_wmem配置影响。

```
$ sysctl -a | grep wmem
net.ipv4.tcp_wmem = 4096 65536 8388608
net.core.wmem_default = 212992
net.core.wmem_max = 8388608
```

tcp_wmem: 发送缓存区的最小值，默认也是4K

# 一些命令记录

`ss -n | grep ESTAB | wc -l`：查看活动连接数量
`cat /proc/meminfo` 查看内存

`slabtop`: 查看到densty、flip、sock_inode_cache、TCP四个内核对象