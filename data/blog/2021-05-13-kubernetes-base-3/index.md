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

如果 Ready 条件处于 `Unknown` 或者 `False` 状态时间超过了 `pod-eviction-timeout` 值，节点上的所有Pod都回被控制器计划删除，默认住处超时市场为**5分钟**。

