---
title: 初识 skopeo
createdDate: "2021-09-23"
updatedDate: "2021-09-23"
tags:
  - containers
origin: true
draft: false
---

# 什么是 skopeo

skopeo是在容器图像和**图像存储库**上执行各种操作的命令行工具。与 Podman 一样，它不需要守护进程，也不需要 root 权限。兼容 docker 镜像和 OCI 镜像。

它大概有以下功能：
* 复制镜像（包括本地、远程甚至文件夹，非常强大！）
* 删除镜像
* 查看镜像信息
* 返回一个远程镜像的标签列表
* 登录、登出远程仓库
* 同步本地和远程镜像
* 镜像签名
* 计算镜像摘要

它支持很多种镜像仓库类型：
* containers-storage:docker-reference 本地镜像存储（podman、cri-o、buildah 和 类似使用 OCI 标准的容器工具拉取的镜像文件文件夹）
* dir:path 现有的本地目录路径，将清单、图层压缩包和签名作为单个文件存储。这是一种非标准化的格式，主要用于调试或非侵入性的容器检查。
* docker://docker-reference 远程镜像仓库
* docker-archive:path[:docker-reference] docker 打包镜像文件
* docker-daemon:docker-reference 本地 docker 拉取的镜像文件
* oci:path:tag 符合 OCI 标准的镜像文件夹


OCI 镜像

我初识它是在一次上线的过程中，当我们的镜像经过测试准备上线预发环境时，一般会将镜像的 tag 由 alpha 变更为 rc ，然后让预发环境的 K8s 来引用此镜像，以前一直使用的是我们的 CI 工作流，并没有注意到其中的细节，直到我这个镜像是一个新的项目，而 CI 工作流变更 TAG 的操作并没有匹配此镜像，需要我手动来做镜像 TAG 的修改。于是，去看了看我们的 CI ，发现它居然是使用的一个叫 skopeo 的工具，而不是 docker。这就很有趣，于是我尝试在本地安装。

# 安装配置 skopeo

Mac安装它也是非常容易的：`brew install skopeo` 即可。
> 在我的 ArchLinux 下，也可以直接使用`sudo pacman -S skopeo`进行安装，其它的 Linux 发行版也类似

与 Podman 不同，skopeo 基本上不需要什么配置的，当然了，为了复制我的镜像，我仍然需要登录镜像仓库：

```shell
skopeo login --username zidoshare docker.io
```

如果是私有仓库，直接将 docker.io 替换为私有化仓库地址即可，这与 docker 类似。

# 使用 skopeo 复制镜像

接下来就是神奇的一幕了，我们的场景是需要重新打 tag，如果是使用 docker，那么我们需要执行如下操作：

```shell
docker pull zidoshare/get-started:0.0.1-alpha1
docker tag zidoshare/get-started:0.0.1-alpha1 zidoshare/get-started:0.0.1-rc1
docker push zidoshare/get-started:0.0.1-rc1
```

其中还有下载上传的操作非常耗时，但是使用 skopeo，一切就不同了：

```shell
$ skopeo copy docker://zidoshare/get-started:0.0.1-alpha1 docker://zidoshare/get-started:0.0.1-rc1
Getting image source signatures
Copying blob 7e9476afc441 skipped: already exists
Copying blob ead11ecb9832 skipped: already exists
Copying blob ea4d16630268 skipped: already exists
Copying blob d1ef2eb755bd skipped: already exists
Copying blob f91050b345a6 skipped: already exists
Copying blob 6ae821421a7d skipped: already exists
Copying blob 3aca3bc5597a [--------------------------------------] 0.0b / 0.0b
Copying config 2f0f422085 [--------------------------------------] 0.0b / 7.2KiB
Writing manifest to image destination
Storing signatures
```

一行命令就搞定，而且，非常快，它直接在镜像仓库中操作，几乎不会有太多的上传下载，十分便捷。 这里的 docker:// 就代表是远程镜像仓库。其它的命令暂时用不上，但是这一个是真的非常强，强烈推荐。

# 总结

podman 与 skopeo 实际上有一定的功能交叉，但是专人专事吧，我一般建议 podman 还是作为本地无守护进程的 容器运行时(管理)工具，而 skopeo 专注于镜像传输，接下来就还差一个镜像构建了，这是下一篇博客的内容。