---
title: 使用beyond compare对比jar包
createdDate: "2021-03-30"
updatedDate: "2021-03-30"
tags:
  - java
origin: true
draft: false
---

# 背景

老大把所有本地lib依赖的jar包全部上传到了私有仓库，让我修改一下maven的依赖，把本地lib全部去掉，之后编译对比一下打出来的包是否一致。

# 解决方案

修改完pom.xml后，不知道咋对比jar包了，十几个依赖不可能一个jar包一个jar包的反编译查看吧。

找了一下，发现了beyond compare这个神器。

使用maven把前后两个版本打包，接着使用beyond compare进行比较，发现无问题，打完手工！

# 真香