---
title: 初识 buildah
createdDate: "2021-09-24"
updatedDate: "2021-09-24"
tags:
  - containers
origin: true
draft: false
image: header.jpg
---

# 什么是 buildah

它是一个专注与构建 OCI 镜像的工具，它可以用来：

* 从头开始或从一个镜像创建一个容器
* 从容器或通过 Dockerfile 创建镜像
* 构建 OCI 或者 docker 格式的镜像
* 挂载容器的根文件系统
* 卸载容器的根文件系统
* 使用容器根文件系统的更新内容作为文件系统层来创建新镜像
* 删除容器或镜像
* 重命名本地容器

那么，有了 Docker 或者 Podman 为什么还需要 buildah？

与之前[podman 配置简介](https://www.zido.site/blog/2021-09-22-prepare-podman/) 所写的一样，buildah 也是无守护进程以及可以 rootless 运行的。

请相信 buildah，构建镜像就别劳烦那俩货了，我认为 podman 居然可以构建镜像就已经是多管闲事了，事实上也有不少反馈反应 podman 构建镜像很慢的。

我们需要更专业的工具来构建镜像。buildah 的思想不再局限通过一个 `Containerfile` 去描述一个镜像，而是为镜像构建提供了一种新的思路，你可以很轻松的复刻任何一个容器为镜像。

# 配置 buildah

buildah 是完全符合 OCI 规范的，所以配置完全参考 [podman 配置简介](https://www.zido.site/blog/2021-09-22-prepare-podman/) 即可。包括 **国内源** 和 **rootless**。

# buildah 的各种操作

## 通过 Dockerfile 构建镜像

当然了，这应该是属于基操（勿6）。准备一个 Dockerfile:

```Dockerfile
FROM fedora:32
MAINTAINER <wuhongxu1208@gmail.com>
RUN echo "hello fedora" > /index.txt
CMD cat /index.txt
```

构建运行：

```shell
$ buildah build -t fedora-hello .
STEP 1/4: FROM fedora:32
STEP 2/4: MAINTAINER <wuhongxu1208@gmail.com>
STEP 3/4: RUN echo "hello fedora" > /index.txt
STEP 4/4: CMD cat /index.txt
COMMIT fedora-hello
Getting image source signatures
Copying blob fa96786f7d52 skipped: already exists
Copying blob 3491ca9ebf88 done
Copying config 58abb8869f done
Writing manifest to image destination
Storing signatures
--> 58abb8869f6
Successfully tagged localhost/fedora-hello:latest
58abb8869f689d53400690e9da3ee4f96705cc907a9b4cbaeec30c7afcebd267
```

构建成功（那不是理所当然的吗），直接用 podman 看一下镜像（换成 buildah 也能看，命令一样）
```shell
$ podman images
REPOSITORY                     TAG         IMAGE ID      CREATED         SIZE
localhost/fedora-hello         latest      a82aa8a08eda  10 seconds ago  209 MB
```

然后就是跑起来啦
```shell
$ podman run --rm fedora-hello
hello fedora
```
完全没有任何问题。但是如果仅仅是这样，那也太不能显示 buildah 的强大之处了。

## 使用命令式构建镜像

buildah 相对于 Dockerfile 提供了强大的命令式构建方式，将 Dockerfile 指令变成一条一条的命令，为我们构建镜像提供了新的选择：

```shell
$ container=$(buildah from fedora:32)
$ buildah run $container -- bash -c 'echo "hello fedora" > /index.txt'
$ buildah config --cmd "cat /index.txt" $container
$ buildah commit $container fedora-hello-cli
Getting image source signatures
Copying blob fa96786f7d52 skipped: already exists
Copying blob 44c13b143fff done
Copying config 454818c642 done
Writing manifest to image destination
Storing signatures
454818c642188a9d2d64f57deedbac40cb22eb597e2ce9c003c8e71d2f150be9
```

再使用 podman 跑一下：
```shell
$ podman run --rm fedora-hello-cli
hello fedora
```

没有任何问题，就很舒服。你可以将这一串指令保存为 .sh，就像 Dockerfile 一样，buildah 官方仓库提供了一个比较完整的示例：

```shell
$ cat > lighttpd.sh <<"EOF"
#!/usr/bin/env bash -x

ctr1=$(buildah from "${1:-fedora}")

## Get all updates and install our minimal httpd server
buildah run "$ctr1" -- dnf update -y
buildah run "$ctr1" -- dnf install -y lighttpd

## Include some buildtime annotations
buildah config --annotation "com.example.build.host=$(uname -n)" "$ctr1"

## Run our server and expose the port
buildah config --cmd "/usr/sbin/lighttpd -D -f /etc/lighttpd/lighttpd.conf" "$ctr1"
buildah config --port 80 "$ctr1"

## Commit this container to an image name
buildah commit "$ctr1" "${2:-$USER/lighttpd}"
EOF
$ chmod +x lighttpd.sh
$ sudo ./lighttpd.sh
```

当然了，这种方式也许并没有太大的吸引力，但是，当它配合上 `mount` 之后，威力就彻底发挥出来了

## 使用 mount 指令

在上面我们创建了一个 $container 变量来存储一个容器名。可以打印一下：

```shell
$ echo $container
fedora-working-container-1
```
接着，我们可以直接把这个容器 mount 进来（其实可以mount任何容器哦）：
> 如果是在 rootless 模式，需要先执行一次 `buildah unshare` 在用户名称空间中启动一个具有修改过的 ID mapping 的命令，因为 mount 需要在不同的命令空间
```shell
$ buildah unshare
$ fedoramnt=$(buildah mount fedora-working-container-1)
```

然后我们就直接把整个容器挂在到了我们的宿主机中，打印一下：

```shell
$ echo $fedoramnt
/home/zido/.local/share/containers/storage/overlay/6f498ec049db976fdc07bae7f0c6b321d2158c120270d1d1a51a18b625b6a449/merged
$ ls $fedoramnt -l
lrwxrwxrwx root root   7 B  Wed Jan 29 02:30:58 2020  bin ⇒ usr/bin
dr-xr-xr-x root root 4.0 KB Wed Jan 29 02:30:58 2020  boot
drwxr-xr-x root root 4.0 KB Tue Apr 27 14:47:38 2021  dev
drwxr-xr-x root root 4.0 KB Tue Apr 27 14:48:12 2021  etc
drwxr-xr-x root root 4.0 KB Wed Jan 29 02:30:58 2020  home
.rw-r--r-- root root  13 B  Fri Sep 24 23:14:46 2021  index.txt
lrwxrwxrwx root root   7 B  Wed Jan 29 02:30:58 2020  lib ⇒ usr/lib
lrwxrwxrwx root root   9 B  Wed Jan 29 02:30:58 2020  lib64 ⇒ usr/lib64
drwx------ root root 4.0 KB Tue Apr 27 14:47:38 2021  lost+found
drwxr-xr-x root root 4.0 KB Wed Jan 29 02:30:58 2020  media
drwxr-xr-x root root 4.0 KB Wed Jan 29 02:30:58 2020  mnt
drwxr-xr-x root root 4.0 KB Wed Jan 29 02:30:58 2020  opt
drwxr-xr-x root root 4.0 KB Tue Apr 27 14:47:39 2021  proc
dr-xr-x--- root root 4.0 KB Tue Apr 27 14:48:12 2021  root
drwxr-xr-x root root 4.0 KB Fri Sep 24 23:11:30 2021  run
lrwxrwxrwx root root   8 B  Wed Jan 29 02:30:58 2020  sbin ⇒ usr/sbin
drwxr-xr-x root root 4.0 KB Wed Jan 29 02:30:58 2020  srv
drwxr-xr-x root root 4.0 KB Tue Apr 27 14:47:39 2021  sys
drwxrwxrwt root root 4.0 KB Tue Apr 27 14:48:12 2021  tmp
drwxr-xr-x root root 4.0 KB Tue Apr 27 14:47:54 2021  usr
drwxr-xr-x root root 4.0 KB Tue Apr 27 14:47:58 2021  var
```

接下来就可以应用任何 linux 工具去修改里面的任意文件，例如：

```shell
$ echo 'hello fedoramnt' > $fedoramnt/index.txt
```

或者甚至，你可以直接 `chroot` 到里面执行 fedora 的任何操作，发挥你的想象吧，我只是做个示例：

```shell
$ chroot $fedoramnt /bin/sh
sh-5.0# ls
sh-5.0# echo "I'm inside" >> index.txt
sh-5.0# cat index.txt
hello fedoramnt
I'm inside
sh-5.0# exit
exit
```

然后卸载该容器文件系统，配上新命令（如果有变化），跑一下：
```shell
$ container=$(buildah umount fedora-working-container-1)
$ buildah config --cmd "cat /index.txt" $container
$ buildah commit $container fedora-hello-cli2
$ podman run --rm fedora-hello-cli2
hello fedoramnt
I'm inside
```

好了，你有新的镜像了，关键是速度非常快。这与 docker commit 有点类似，却有是完全不同的工作流，就很香。

# 总结

至此，OCI 三剑客就介绍完了，podman、skopeo、buildah 互相之间功能会有些重叠，不过总的来看还是专人专事的。

另外可能大家会好奇为什么我会纠结于 rootless 模式，这是因为我的工作内容大概就是为用户提供一个可连接的 k8s 容器，因此我会很关注安全，因为你永远无法预测用户会在容器内干什么，一不小心逃逸出来就是大乱子了。

相比起原来的 Docker。OCI 镜像事实上具有很多意想不到的可玩性，如果有时间，我后面可能会出一些博文讲解一下具体的应用吧（挖个坑，管挖不管埋）。