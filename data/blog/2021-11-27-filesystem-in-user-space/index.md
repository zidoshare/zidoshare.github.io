2021-11-27-filesystem-in-user-space

---
title: 详解用户态文件系统
createdDate: "2021-11-27"
updatedDate: "2021-11-27"
tags:
  - fuse
  - containers
origin: true
draft: true
---

# 用户态文件系统介绍

FUSE (用户空间中的文件系统)是用户空间程序将文件系统导出到 Linux 内核的接口。FUSE 项目由两个组件组成：FUSE 内核模块(在常规内核存储库中维护)和用户空间库。

> 用户空间库有一个参考实现，叫 [libfuse](https://github.com/libfuse/libfuse)。

## 为什么一定要是**用户态**

* 当处于用户态时，首当其冲的好处就是，不再需要使用 root 用户去 mount 文件系统了，如果你是非系统管理员，也能够去 mount 一个指定的虚拟文件系统。这催生了著名的 [fuse-overlayfs](https://github.com/containers/fuse-overlayfs)，其在 rootless 容器化中扮演重要的角色，事实上 docker 当年一定要 root 守护进程的一个重要原因就是没有合适的用户态堆叠文件系统，导致架构不得不妥协，甚至导致后续严重的安全隐患，再后来随着用户态文件系统的发展，docker 19.03 才终于实验性地支持 rootless 模式了！！
* 其次，你不再需要去修改内核就能实现一个文件系统，完全发挥你的想象，例如非常著名的 [sshfs](https://github.com/libfuse/sshfs)，只要能连接 ssh ，你就能直接挂载一个远程的文件系统。

## 用户态文件系统并不那么**用户态**

事实上，用户态文件系统并不那么的用户态，因为你的代码并不是真正在用户态去访问文件系统，它其实只是一层代理，当调用文件系统时，最先进去的仍然是 VFS,真正的文件 IO 操作最终还是由内核实现，而在用户态能做的，是作为一个守护进程，将内核传递的 fuse request 经由用户态进行处理，再调用 vfs 让内核去写数据。结构图如下：

![fuse-structure](./fuse-structure.jpg)

但是这样的设计对于用户开发是有极大好处的：

* 用户无需关心文件系统底层细节，只需与 VFS 交互即可实现一个文件系统。
* 用户态崩溃不会影响到内核。
* 你只需要遵循协议，可以使用任意语言实现。

# fuse 基本原理

Linux 的 FUSE 内核模块会通过 vfs 暴露一个 /dev/fuse 的设备文件：
```shell
$ ls -l /dev/fuse
crw-rw-rw- root root 0 B Thu Nov 18 22:24:32 2021 /dev/fuse
```

所有用户均可进行读写，这即是我们与 FUSE 内核模块交流的纽带。
