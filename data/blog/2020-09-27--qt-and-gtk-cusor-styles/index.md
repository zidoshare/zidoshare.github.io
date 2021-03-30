---
title: Gnome桌面中QT应用与GTK应用鼠标不一致解决方案
createdDate: "2020-09-27"
updatedDate: "2020-09-27"
tags:
  - linux日常
  - gnome
  - archlinux
origin: true
draft: false
---

# 解决方案

修改`/usr/share/icons/default/index.theme`即可

默认主题为
```
[Icon Theme]
Inherits=Adwaita
```

我现在使用的鼠标主题为：Bibata-Modern-Classic

所以修改为：

```
[Icon Theme]
Inherits=Bibata-Modern-Classic
```

需要重启QT应用才能生效。

# 参考连接

* [https://bbs.archlinux.org/viewtopic.php?id=178082](https://bbs.archlinux.org/viewtopic.php?id=178082)