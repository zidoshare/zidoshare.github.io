---
title: kubernetes学习笔记（8）- pod 网络通信
createdDate: "2021-07-08"
updatedDate: "2021-07-08"
tags:
  - kubernetes
origin: true
draft: false
---

# 概述

通过文章[pause 容器](https://www.zido.site/blog/2021-07-06-kubernetes-pause/)，我们知道同 pod 中的容器之间通过 `Join Namespace` 实现网络设备的共享，因此 pod 内网络可以通过 `localhost` 互相通信，就像访问本机一样通过不同端口访问应用。

而每个 pod 有一个自己的 IP 地址。那么他们之间是如何通信的呢？

# Network Namespace 互相通信

事实上，很容易想到，同节点中的 pod 通信其核心问题就是 `Network Namespace` 直接怎么通信。

尝试创建一下`Network Namespace`。

先看一下服务器中的 namespace 列表：
```
# lsns
        NS TYPE  NPROCS   PID USER    COMMAND
4026531836 pid       88     1 root    /usr/lib/systemd/systemd --switched-root --system --deserialize 22
4026531837 user     128     1 root    /usr/lib/systemd/systemd --switched-root --system --deserialize 22
4026531838 uts       88     1 root    /usr/lib/systemd/systemd --switched-root --system --deserialize 22
4026531839 ipc       88     1 root    /usr/lib/systemd/systemd --switched-root --system --deserialize 22
4026531840 mnt       84     1 root    /usr/lib/systemd/systemd --switched-root --system --deserialize 22
4026531956 net       88     1 root    /usr/lib/systemd/systemd --switched-root --system --deserialize 22
```

