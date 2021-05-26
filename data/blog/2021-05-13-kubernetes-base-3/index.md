---
title: kubernetes学习笔记（3）-架构
createdDate: "2021-05-25"
updatedDate: "2021-05-25"
tags:
  - kubernetes
origin: true
draft: false
---

# 节点（Node）

* 节点就是一个具体的虚拟机或者物理机器，上面运行的是Pod。
* 每个节点包含运行Pods所需的服务。
* 节点由控制平面（Control Plane）负责管理。
* 集群里有一个或多个节点都行。
* 节点中包含 **kubelet**、**容器运行时**、**kube-proxy** 等组件。
> 控制平面是指容器编排层，它暴露 API 和接口来定义、部署容器和管理容器的生命周期。

## 管理

添加节点到 API 服务器的方式有两种：
1. 节点中的 `kubelet` 向控制平面执行自注册。
2. 手动添加 Node 对象。

一个节点的示例json结构：

```json
{
  "kind": "Node",
  "apiVersion": "v1",
  "metadata": {
    "name": "10.240.79.157",
    "labels": {
      "name": "my-first-k8s-node"
    }
  }
}
```

其中，`metadata.name` 必须是合法的DNS子域名。

当节点中所有服务都在运行中时，代表节点是健康的，可以用来运行Pod。否则会被忽略。

> 即使不健康，Kubernetes也不会主动删除节点，而是一直检查是否健康，直到显式删除节点。

## 节点状态

* 地址
* 状况
* 容量和可分配
* 信息

以下命令查看节点的细节：

```shell
kubectl describe node <节点名称>
```

### 地址

* HostName：由节点内核设置。kubelet `--hostname-override` 参数可进行覆盖
* ExternalIP：一般是可以从集群外访问的IP地址。
* InternelIp：一般是集群内部访问的IP地址。

### 状况

`condition` 字段描述处于`Running`节点的状态。

| 节点状况          | 描述                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| Ready             | 健康为True；不健康且不能接收Pod为False；Unknown表示在node-monitor-grace-period 期间（默认 40 秒）没有收到节点的消息 |
| DiskPressure      | 节点控件控件是否足以添加新的Pod                                                                                     |
| MemoryPresure     | 节点是否存在内存压力（内存不足）                                                                                    |
| PIDPressure       | 节点是否存在进程压力（进程过多）                                                                                    |
| NetworkUnvaliable | 网络配置不正确                                                                                                      |

如果 Ready 条件处于 `Unknown` 或者 `False` 状态时间超过了 `pod-eviction-timeout` 值，节点上的所有Pod都回被控制器计划删除，默认逐出超时时长为**5分钟**。

### 容量与可分配

节点上的可用资源：

* CPU
* 内存
* 可以调度到节点上的Pod的个数上限

capacity：节点拥有的资源总量
allocatable：节点可供普通Pod消耗的资源量。

### 信息

一般信息，例如内核版本、Kubernetes版本(`kubelet` 和 `kube-proxy` 版本）、Docker版本和操作系统名称。信息由 `kubelet` 收集。

### 节点控制器

控制平面的组件，用于管理节点。

* 当节点注册时分配 CIDR 区段（如果启用了 CIDR 分配）。
* 保持节点列表与云服务商所提供的可用机器列表同步。
* 监控节点健康情况。默认40秒后报告”Unknown“状态，之后5分钟开始逐出Pod。

每隔 `--node-monitor-period` 秒检查节点状态。

### 心跳机制

作用：确定节点的可用性。

两种形式：

* `NodeStatus`
* Lease 对象

每个节点在 `kube-node-lease` 名称空间中都有一个关联的 `Lease` 对象。
> Lease对象： 一种轻量级资源。用于提高在集群规模扩大时心跳机制的性能。

`kubelet` 负责创建和更新 `NodeStatus` 和 `Lease` 对象。

* 状态发生变化或者配置的时间间隔内没有更新事件时，kubelet 更新 `NodeStatus`。`NodeStatus` 更新的默认间隔为5分钟（比不可达节点的40秒默认超时时间长很多）。
* `kubelet` 每隔10秒创建并更新 `Lease` 对象。如果更新失败，采用指数回退机制，从200毫秒开始重试，最长间隔7秒。

### 可靠性

大部分情况下，节点控制器把逐出速率限制在每秒 `--node-eviction-rate` 个（默认0.1）。

一个可用区域中的节点不健康时，驱逐行为发生改变。同时检查可用区域不健康的节点的百分比，如果超过 `--unhealthy-zone-threshold` （默认0.55），驱逐速率降低。如果集群小于等于 `--large-cluster-size-threshold` 个节点（默认50）。则停止驱逐。否则驱逐速率降为每秒 `secondary-node-eviction-rate` 个（默认0.01）。

### 节点容量

* 自注册机制生成的 Node 对象在注册期间自动报告自身容量
* 手动添加的 Node ，需要手动设置节点容量。

调度器会保证节点尚有足够的资源供所有的Pod使用。

# 控制平面到节点通信

节点 API 服务器和 Kubernetes 集群之间的通信路径。

## 节点到控制平面

中心辐射型（Hub-and-Spoke）API 模式。

apiserver 在安全的 HTTPS 端口尚监听远程连接请求，并启用一种或多种形式的客户端身份认证机制。

# 控制平面到节点通信

节点 API 服务器和 Kubernetes 集群之间的通信路径。

## 节点到控制平面

中心辐射型（Hub-and-Spoke）API 模式。

apiserver 在安全的 HTTPS 端口尚监听远程连接请求，并启用一种或多种形式的客户    端身份认证机制。

## 控制平面到节点

* 从 apiserver 到集群中每个节点尚运行的 kubelet 进程。
* 从 apiserver 通过代理功能连接到任意节点、Pod或者服务。


