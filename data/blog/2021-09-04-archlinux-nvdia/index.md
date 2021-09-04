---
title: archlinux nvidia 独显配置
createdDate: "2021-09-04"
updatedDate: "2021-09-04"
tags:
  - arch
origin: true
draft: false
---

# 现状
我现在的情况是安装了独显
```
sudo pacman -S nvidia nvidia-utils
```
从 gdm 进入 gnome 选择的是【gnome】而不是【gnome-xorg】。但是我进系统之后发现不对劲，明显不是很流畅，输出一下`echo $XDG_SESSION_TYPE` 发现是 X11。阿这。。。。赶紧看一下 wayland 装了吗？

```shell
$ pacman -Qs wayland
local/deepin-wayland 1.0.0-1 (deepin)
    DDE wayland support libraries
local/egl-wayland 1.1.7-1
    EGLStream-based Wayland external platform
local/kwayland 5.85.0-1 (kf5)
    Qt-style Client and Server library wrapper for the Wayland libraries
local/lib32-wayland 1.19.0-1
    A computer display server protocol
local/libva 2.12.0-1
    Video Acceleration (VA) API for Linux
local/qt5-wayland 5.15.2+kde+r29-1 (qt qt5)
    Provides APIs for Wayland
local/wayland 1.19.0-1
    A computer display server protocol
local/wayland-protocols 1.21-1
    Specifications of extended Wayland protocols
local/xorg-xwayland 21.1.2-1 (xorg)
    run X clients under wayland
```

没毛病啊，而且我明显默认进入桌面的，怎么会是 xorg 呢？强制使用 wayland 运行应用试试：
```shell
GDK_BACKEND=wayland gedit
```

发现运行报错。可能这就是原因？
# 解决
翻了翻文档，尝试让内核优先加载独显驱动。

首先通过 grub 来添加内核启动参数 `nvidia-drm.modeset=1` 。这会开启DRM 内核级显示模式。修改 `/etc/default/grub` 文件。添加 `nvidia-drm.modeset=1` 到 `GRUB_CMDLINE_LINUX_DEFAULT` 行中。我这里大概是这样
```
GRUB_CMDLINE_LINUX_DEFAULT="loglevel=3 quiet nvidia-drm.modeset=1"
```

但是 nvidia 内核在 GDM 之后才加载，于是需要在启动过程中添加四个内核模块：`nvidia`、 `nvidia_modeset`、 `nvidia_uvm` 以及 `nvidia_drm`。

修改文件 `/etc/mkinitcpio.conf`:
```
MODULES=(nvidia nvidia_modeset nvidia_uvm nvidia_drm)
```
加入这四个模块后，就需要每次更新 nvidia 驱动之后运行一次 mkinitcpio。这可以使用 pacman 钩子来自动化：

添加 `/etc/pacman.d/hooks/nvidia.hook` 文件：

```
[Trigger]
Operation=Install
Operation=Upgrade
Operation=Remove
Type=Package
Target=nvidia
Target=linux
# Change the linux part above and in the Exec line if a different kernel is used

[Action]
Description=Update Nvidia module in initcpio
Depends=mkinitcpio
When=PostTransaction
NeedsTargets
Exec=/bin/sh -c 'while read -r trg; do case $trg in linux) exit 0; esac; done; /usr/bin/mkinitcpio -P'
```

务必保证 Target 项所设置的软件包与你在前面的安装过程中所使用的相符（例如nvidia 或 nvidia-dkms 或 nvidia-lts 或 nvidia-ck-something）。

> 注意： Exec 那一行看起来非常复杂，是为了避免在 nvidia 和 linux 软件包都发生更新的时候重复运行 mkinitcpio。如果你觉得无所谓，可以删掉 Target=linux 以及 NeedsTargets，然后 Exec 就可以简化为 Exec=/usr/bin/mkinitcpio -P。

# 最后

在独显下运行 wayland 发现问题还挺多的，首先是硬件加速，不论是 `va`、`vdp` 貌似都不行。导致只要涉及到硬件编解码的都会有点问题：

* obs-studio 录制显示屏黑屏（日志有警告，EGL Driver message (Critical) eglMakeCurrent: Failed to make the GLX context current）
* obs-studio 录制窗口直接死机（日志是 core dump。`libDeckLinkAPI.so: cannot open shared object file: No such file or directory`，这个貌似是驱动设置有问题？非常奇怪）
* mpv 看视频黑屏 （日志有警告，貌似 wayland 关于休眠的一个 api 未实现）
* gnome 40 的 `activity` 界面偶尔闪烁
* 上一条的基础上，如果开了 wine。闪到你怀疑人生，而且预览图会突然变成 wine 程序，比如 QQ 。
* fcitx5 输入在某些应用下闪烁（比如 gedit）
* fcitx5 偶尔定位漂移
* Chrome 开启硬件加速 看视频居！然！没！有！问！题？？？稳如老狗，yyds

wayland 问题那么多基本上都影响到我正常使用了，特别是闪烁的问题，大晚上的，闪瞎眼。考虑到这个问题，最终还是选择了 xorg，稳👍🏻。