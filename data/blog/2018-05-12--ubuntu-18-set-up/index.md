---
title: ubuntu使用日常：18.04中杂项处理+美化记录
tags:
  - ubuntu
  - system
createdDate: '2018-05-12'
updatedDate: '2018-05-12'
draft: false
origin: true
image: header.png
---

记录 ubuntu 18.04 中的一些操作，包含基本要做的事情、异常处理和一些美化。

## 卸载不需要的软件

> 最小安装基本不需要

```bash
sudo apt thunderbird totem rhythmbox empathy brasero simple-scan gnome-mahjongg aisleriot gnome-mines cheese transmission-common gnome-orca webbrowser-app gnome-sudoku  landscape-client-ui-install onboard deja-dup libreoffice-common
```

卸载了不常用的软件，包括 libreoffice。另外还可以卸载 firefox `sudo apt remove firefox*`

## 安装常用软件

### 搜狗输入法

### 网易云音乐

### chrome

```bash

wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb

sudo dpkg -i google-chrome-stable_current_amd64.deb


```

### Git vim curl 等

```bash

sudo apt install git vim curl

```

### zsh & oh-my-zsh

```bash

sudo apt install zsh

sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"

```

### 安装 crossover + tim

官网下载最新的 crossover（如需破解，自行百度），打开 crossover 安装 tim 或其他常用软件。

> 注意此处有坑，tim 后台图标无法放到系统的图标栏，会显示一个 win system tray 窗口，如果把这个窗口关掉，tim 最小化之后，你就没有办法打开了，只能 kill 掉，然后重新打开。解决方案仍在找寻中。。。

> 更新于 2018-06-19。只需要安装[topicons](https://extensions.gnome.org/extension/495/topicons/)扩展即可解决～

### 安装 jetbrains toolbox

[toolbox app 链接](https://www.jetbrains.com/toolbox/app),下载压缩包，解压，执行里面的唯一的 jetbrains-toolbox 文件即可执行

我需要用的软件有 idea/webstorm/datagrid/clion/goland。

### vscode

官网下载 deb 包下载安装

## 美化

安装 gnome-tweak-tool

```bash
sudo apt install gnome-tweak-tool
```

找到扩展栏，打开 user themes

安装 dash to dock

> 注意这里也有一个坑，至少我在两台电脑上都遇到了，安装 dash to dock 之后，正常情况下没有问题，但是当电脑休眠（注意不是 logout）之后，dock 不会消失，再次解锁之后，桌面显示正常，但是进入搜索时，会出现两个 dock，经过一番查找之后，感觉最佳的解决方案是卸载默认 dock,[讨论传送门](https://bugs.launchpad.net/bugs/1716982)。执行命令`sudo apt remove gnome-shell-extension-ubuntu-dock` ,然后重启，问题解决。

然后是我常用扩展：

- 'window is ready' notification remover
- coverflow alt-tab
- hide top bar

### 主题 & icon

- application -> [Vimix-Dark-Laptop-Beryl](https://github.com/vinceliuice/vimix-gtk-themes)
- icon -> [Papirus-Adapta-Nokto](https://github.com/PapirusDevelopmentTeam/papirus-icon-theme)
- shell -> [Vimix-Dark-Laptop-Beryl](https://github.com/vinceliuice/vimix-gtk-themes)

### 修改登录页面背景

编辑 /etc/alternatives/gdm3.css 文件，

找到

```css
#lockDialogGroup {
  background: #2c001e url(resource:///org/gnome/shell/theme/noise-texture.png);
  background-repeat: repeat;
}
```

修改为

```css
#lockDialogGroup {
  background: #2c001e url(file://这里填入你想要的背景图地址.eg:/usr/share/background/xx.jpg);
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}
```

重启。

### 美化 grub2 启动界面

[gnome-look](https://www.gnome-look.org/browse/cat/109/ord/latest/)中找到喜欢的主题，我选择了[Blur grub](https://www.gnome-look.org/p/1220920/).下载解压，执行里面的 install.sh 即可。

可选安装图形管理工具 Grub Customizer。

```bash
sudo add-apt-repository ppa:danielrichter2007/grub-customizer
sudo apt-get update
sudo apt-get install grub-customizer
```
