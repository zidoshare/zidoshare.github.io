---
title: kubernetes基础概念笔记
createdDate: "2021-05-13"
updatedDate: "2021-05-13"
tags:
  - kubernetes
origin: true
draft: false
---

# 基础概念

Kubernetes 是一个可移植的、可扩展的开源平台，用于管理容器化的工作负载和服务，可促进声明式配置和自动化。 Kubernetes 拥有一个庞大且快速增长的生态系统。Kubernetes 的服务、支持和工具广泛可用。


Kubernetes的主要功能`：

* 服务发现和负载均衡
> Kubernetes 可以使用 DNS 名称或自己的 IP 地址公开容器，如果进入容器的流量很大， Kubernetes 可以负载均衡并分配网络流量，从而使部署稳定。
* 存储编排
> Kubernetes 允许你自动挂载你选择的存储系统，例如本地存储、公共云提供商等。
* 自动部署和回滚
> 你可以使用 Kubernetes 描述已部署容器的所需状态，它可以以受控的速率将实际状态 更改为期望状态。例如，你可以自动化 Kubernetes 来为你的部署创建新容器， 删除现有容器并将它们的所有资源用于新容器。
* 自动完成装箱计算
> Kubernetes 允许你指定每个容器所需 CPU 和内存（RAM）。 当容器指定了资源请求时，Kubernetes 可以做出更好的决策来管理容器的资源。
* 自我修复
> Kubernetes 重新启动失败的容器、替换容器、杀死不响应用户定义的 运行状况检查的容器，并且在准备好服务之前不将其通告给客户端。
* 密钥与配置管理
> Kubernetes 允许你存储和管理敏感信息，例如密码、OAuth 令牌和 ssh 密钥。 你可以在不重建容器镜像的情况下部署和更新密钥和应用程序配置，也无需在堆栈配置中暴露密钥。

## 组件

### 控制平面组件（Control Plane Components）

这类组件主要对集群做全局决策（比如调度），以及检测和相应集群事件（例如当不满足部署的replicas字段时，启动新的pod）。控制平面组件可以在任何节点上运行，但是一般简单起见，会在同一个计算机上启动所有控制平面组件，并且不会在此计算机上运行用户容器。

* kube-apiserver: Kubernetes API服务。
* etcd: 键值数据库，保存Kubernetes所有集群数据的后台数据库。
* kube-scheduler: 监视新创建的、未指定运行节点的Pods，选择节点让Pods在上面运行。
* kube-controller-manager: 负责运行 控制器 的组件。包括：
  * 节点控制器（Node Controller）: 负责在节点出现故障时进行通知和响应
  * 任务控制器（Job Controller）： 监测代表一次性任务的Job对象，然后创建Pods来运行这些任务直至完成
  * 端点控制器（Endpoints Controller）：填充端点（Endpoints）对象（即加入Service与Pod）
  * 服务账户和令牌控制器（Service Account & Token Controllers）：为新的命名空间创建默认账户和Api访问令牌

* cloud-controller-manager: 云控制管理器，嵌入特定云的控制逻辑的组件。允许链接聚合到云提供商的应用编程接口中，并分离出相互作用的组件与集群交互的组件。

### Node组件

节点组件在每个节点中运行，维护运行的Pod并提供Kubernetes运行环境。

* kubelet： 负责保证容器都运行在Pod中，接收一组通过各类机制提供的PodSpecs，确保这些PodSpecs中描述的容器处于运行状态且健康。kubelet不会管理不是由Kubernetes创建的容器。
* kube-proxy：节点的网络代理，是实现Kubernetes服务概念的一部分。维护节点上的网络规则。
* 容器运行时（Container Runtime）： 负责运行容器的软件，Kubernetes支持多个容器运行环境： Docker、containerd、CRI-O以及任何实现Kubernetes CRI(容器运行环境接口)。

### 插件(Addons)

插件使用Kubernets资源实现集群功能，插件中命名空间域的资源属于`kube-system`命名空间。

* DNS：几乎所有Kubernetes集群都应该由集群DNS。集群DNS时一个DNS服务器，和环境中的其他DNS服务器一起工作，为Kubernetes服务提供DNS记录。
* Web界面(仪表盘)： Dashboard时Kubernetes集群的通用的、基于Web的用户界面。
* 容器资源监控：将一些常见的事件序列度量值保存到一个集中的数据库中，并提供用于浏览这些数据的界面。
* 集群层面日志：负责将鸥鸟过期的日志数据保存到一个集中的日志存储中，该存储能够提供搜索和浏览接口。

### 节点

Kubernetes集群由一组**节点**组成，节点是Kubernetes中**最小的计算硬件单元**。

### Pod

Kubernetets不直接运行容器，它将一个或多个容器封装到Pod中。相同的Pod中的任何容器共享相同的名称空间和本地网络（用于通信等）。Pod是Kubernetes应用的最小单元，Kubernetes进行缩放时就会将Pod的新副本部署到集群中。


