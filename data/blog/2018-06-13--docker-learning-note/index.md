---
title: docker学习纪录
tags:
  - docker
  - learning
createdDate: '2018-06-13'
updatedDate: '2018-06-13'
draft: false
origin: true
image: header.png
---

# docker 安装

```shell
yum update
curl -fsSL https://get.docker.com/ | sh
service docker start
```

使 docker 开机启动 `systemctl enable docker`

> enable:开机启动 start:启动 stop:停止

设置 docker 镜像加速器

访问[阿里云容器服务](https://cr.console.aliyun.com/#/accelerator)，可以看到对应的加速器地址以及执行的命令，可以说想当方便了，直接 ctrl+c ctrl+v
![我来写代码啦](./images/ctrlc.jpg)

至此，docker 就安装完毕，也可以[手动安装 docker](https://docs.docker.com/install/linux/docker-ce/centos/#install-docker-ce)

# 学习笔记

晚上有太多 docker 相关介绍，不再重新整理，仅仅纪录一些 docker 需要注意的笔记

镜像是容器的基础,每次执行 docker run 的时候都会指定哪个镜像作为容器运
行的基础。

镜像是多层存储,每一层是在前一层的基础上进行
的修改;而容器同样也是多层存储,是在以镜像为基础层,在其基础上加一层作为
容器运行时的存储层。

Dockerfile 中每一个指令都会建立一层

镜像构建时,一定要确保每一层只添加真正需要
添加的东西,任何无关的东西都应该清理掉。

Docker 在运行时分为 Docker 引擎
(也就是服务端守护进程)和客户端工具,Docker 的引擎提供了一组 REST API,
被称为 Docker Remote API,一切都是使用的远程调用形式在服务端
(Docker 引擎)完成。docker build 命令得知这个路径后,会将路径下的所有内容打包,然后上
传给 Docker 引擎。

docker build 还支持从 git/压缩包构建
