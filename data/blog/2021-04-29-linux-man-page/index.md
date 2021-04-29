---
title: linux man使用
createdDate: "2021-04-29"
updatedDate: "2021-04-29"
tags:
  - linux
origin: true
draft: false
---

# 安装

man-db 提供了 man 命令，less 是 man 的默认分页器。

man-pages 提供了 Linux man 页面的内容。

对于中文可以使用：

* [manpages-zh](https://github.com/man-pages-zh/manpages-zh)

gnome 桌面下可以使用 gnome-help查询

# 使用

通过以下命令阅读man手册页：
```
man 手册名
```

man手册页分为很多段落。

man手册页通过名称和所属分类标识。有些不同分类的man手册页名字可能相同，比如 man(1) 和 man(7)，这时需要额外指明分类以访问需要的手册。例如：

```
man 5 passwd
```
会显示有关文件/etc/passwd，而非命令 passwd，的内容。

# 搜索

如果不知道需要查阅的手册名，可以使用`-k` 或者 `--apropos` 参数就可以按给定关键词搜索相关手册。

关键词搜索特性是从一个专用的缓存生成的。默认情况下你没有这个缓存，所以无论你搜什么，都会提示你nothing appropriate。你可以通过下面的命令来生成这个缓存：

```
mandb
```

每当你安装新的manpage之后都需要运行这个命令，缓存才会更新。

现在你可以开始搜索了。 例如，要查阅有关密码的手册（“password”）,可以使用下面的命令:

```
man -k password
man --apropos password
apropos password
```

关键字可以使用正则表达式。

如果你想全文搜索的话，你可以用-K选项：

```
man -K password
```

通过whatis命令，可以只显示需要的man手册页的简要信息。如果只是想获取对命令 ls 的简要说明，使用以下命令：

```
whatis ls
```

# 使用浏览器阅读手册页

除了使用命令行阅读之外，还可以使用浏览器阅读手册。

不同的发行版可能不同，在archlinux下，可以使用

```
man -H free
```
来使用浏览器阅读，默认使用的浏览器会通过`BROWSER`环境变量获取

# 个人配置

我一般会下载manpages-zh，并在`.bashrc`/`.zshrc`下做以下配置：

```
# 配置默认浏览器为chrome，这里主要是为了 man -H free 命令
export BROWSER=google-chrome-stable
# 配置中文man page
alias cman='man -M /usr/share/man/zh_CN'
```

便可以使用cman 代替man命令进行查询
