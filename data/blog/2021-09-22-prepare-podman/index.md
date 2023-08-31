---
title: podman 配置简介
createdDate: "2021-09-22"
updatedDate: "2021-09-22"
tags:
  - containers
origin: true
draft: false
image: header.jpg
---

# 什么是 Podman

Podman 是一个**无守护程序**的开源 Linux 原生工具，旨在使用开放容器倡议（OCI）容器和容器镜像轻松查找、运行、构建、共享和部署应用程序。Podman提供了一个使用过 Docker 容器引擎的人都熟悉的命令行界面（CLI）。大多数用户可以简单地将 Docker 设置为 Podman 的别名（`alias docker=podman`），没有任何问题。与其他常见的容器引擎（Docker、CRI-O、containerd）类似，Podman依赖于一个符合OCI标准的容器运行时间（runc、crun、runv等）来与操作系统对接并创建运行的容器。这使得由Podman创建的运行容器与其他普通容器引擎创建的容器几乎没有区别。

Podman 几乎就是 Docker 的替代品。为什么有了 Docker 还需要 Podman？

显而易见， Docker 太臃肿了，另外，它需要守护进程运行，通过套接字与特权进程通信来运行容器的方式是不安全的。

我们需要一套更轻量、更标准化、发展更快速的工具，而 Podman 就是其中之一。

* 不需要守护进程。
* 大部分情况下甚至不需要 Root 权限。
* 天生为 OCI 景象格式而生。

# 安装与配置

Podman 的安装是非常简单的，在各大 Linux 发行版下基本都能直接安装（Ubuntu 简直是耻辱，还要加 PPA)。

我的 ArchLinux 运行 `sudo pamcan -S podman` 即可。

## 配置 rootless

正常情况下，你就已经可以使用 `sudo podman run --rm hello-world` 来验证结果了，但是为了体现 podman 的安全性，我们会选择使用 rootless 模式来运行。

首先，检查 `kernel.unprivileged_userns_clone`内核参数:
```shell
sysctl kernel.unprivileged_userns_clone
```
如果输出为 0，你需要使用将它设置为 1 。

接下來需要检查 `subuid` 和 `subgid`。

```shell
cat /etc/subuid
cat /etc/subgid
```

如果没有值，那么可以通过`touch /etc/subuid /etc/subgid`来新建文件，然后使用以下命令来设置值：
```shell
sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 username
```
也可以直接编写这两个文件：
```shell
$ cat /etc/subuid
username:100000:65536
```
```shell
$ cat /etc/subgid
username:100000:65536
```

修改完之后，podman 并不会直接生效，还需要运行以下命令：

```shell
podman system migrate
```

## 配置国内源

接下來，可以配置国内源了，在这之前，我们需要知道，当配置完 rootless 模式之后，会新增一个用户配置文件的读取路径，原来的配置文件路径为`/etc/containers`，当使用 rootless 模式之后，则会读取`${XDG_CONFIG_HOME/containers}`(通常是`~/.config/containers`目录)。

因此我们可以直接编辑这里的配置文件来单独配置此用户的国内源，也可以直接编辑全局配置文件。

在配置文件夹下编辑（没有就创建） `registries.conf`。
```
unqualified-search-registries = ["docker.io"]

[[registry]]
prefix = "docker.io"
insecure = false
blocked = false
location = "docker.io"
[[registry.mirror]]
location = "f1361db2.m.daocloud.io"
[[registry.mirror]]
location = "registry.docker-cn.com"
```

这会依次使用以下 url 去查找下载镜像。

* registry.docker-cn.com
* f1361db2.m.daocloud.io
* docker.io

# 总结

配置上会稍微比 docker 繁琐一点，但是还好就一次配置，并且无守护进程的体验确实会很爽。

podman 是新时代容器化工具的三大神器的核心，也是 docker 的替代品，现在仍然在活跃的快速演进。 随着 k8s 的发展，docker 想来真的是要被驱逐出核心圈子了。
