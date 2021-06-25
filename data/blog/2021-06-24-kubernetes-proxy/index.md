---
title: kubernetes学习笔记（5）- 使用kube proxy 代理
createdDate: "2021-06-24"
updatedDate: "2021-06-24"
tags:
  - kubernetes
origin: true
draft: false
---
# 背景

搭建 k8s 集群时，因业务限制，需要使用内网 ip。因此 kubeconfig 中的 cluster server 为内网地址。

此时本地的 kubectl 无法通过指定的 kubeconfig 去连接远程 k8s 服务。

# kubectl proxy

立马想到可以尝试使用代理进行连接。查一查 kubernetes 文档，果然有一个 `kubectl proxy`命令。

运行 `kubectl proxy --port=8080`。

将集群中的 kubeconfig down下来。修改 server地址为 `http://公网地址`。

使用`kubectl --kubeconfig ~/kube/app.conf version` 尝试连接。无法连接。

设置绑定地址`--address=0.0.0.0`，尝试连接，返回Forbidden。

设置允许的host为：`--accept-hosts=.*`，尝试连接，成功。

# 坑

发现连接成功，就没再去关注，想起来去看看容器情况，执行 `kubectl exec -it`。

发现`error: unable to upgrade connection: Forbidden`。看起来像是 Upgrade Connection 失败。也就是长连接无法使用。

去 github 上查看issue，原来是 kube porxy 有个请求头过滤器。使用`--disable-filter=true` 关闭即可。