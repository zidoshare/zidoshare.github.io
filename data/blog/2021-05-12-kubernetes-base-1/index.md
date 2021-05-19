---
title: kubernetes基础使用笔记
createdDate: "2021-05-12"
updatedDate: "2021-05-12"
tags:
  - kubernetes
origin: true
draft: false
---
# 创建集群

Minikube 是由 Kubernetes 社区维护的单机版的 Kubernetes 集群。

`minikube version` 查看 minikube 安装情况。

`minikube start` 运行 minikube。

`minikube status` 查看 minikube 的运行状态。

`kubectl version` 查看 kubectl 安装情况。

`kubectl cluster-info` 查看集群给中的运行细节。

`kubectl get nodes` 查看集群给中的节点。

# 部署应用

**Deployment** 主要用于指挥 Kubernetes 如何创建和更新应用程序的实例。

> 创建应用程序实例后，Kubernetes Deployment 控制器会持续监视这些实例。 如果托管实例的节点关闭或被删除，则 Deployment 控制器会将该实例替换为群集中另一个节点上的实例。 这提供了一种自我修复机制来解决机器故障维护问题。

```
kubectl create deployment kubernetes-bootcamp --image=gcr.io/google-samples/kubernetes-bootcamp:v1
```

部署示例应用的 Deployment。

`kubectl get deployments` 查看所有的 Deployment

Kubernetes 内部运行的 Pod 在私有的隔离网络上运行。 默认情况下，它们在同一 kubernetes 集群中的其他 Pod 和服务中可见，但在该网络外部不可见。为此可以通过 `kubectl proxy` 开启一个代理来访问。

> 注意这里需要打开新的控制台，这是一个代理服务

`export POD_NAME=$(kubectl get pods -o go-template --template '{{range .items}}{{.metadata.name}}{{"\n"}}{{end}}')` 这可以输出 pod 名字。

# 了解应用

Pod 是 Kubernetes 抽象出来的，表示一组一个或多个应用程序容器（如 Docker)，以及这些容器的一些共享资源。这资源包括

* 共享存储，当作卷。
* 网络，作为唯一的集群 IP 地址。
* 有关每个容器如何运行的信息，例如容器映像版本或要使用的特定端口。

Pod 是一组一个或多个应用程序容器（例如 Docker），包括共享存储（卷), IP 地址和有关如何运行它们的信息。

Pod 是 kubernetes 中的最小单元，Deployment 会创建 Pod 而不是具体的容器，每个 Pod 与调度它的工作节点绑定，并保持在那里知道终止或删除。如果工作节点发生故障，则会在集群中的其他可用工作节点上调度相同的 Pod。

> Pod 可能包含多个容器

一个 Pod 总是运行在**工作节点**。工作节点是 Kubernetes 中的参与计算的机器，可以是虚拟机或物理计算机，具体取决于集群。每个工作节点由主节点管理。工作节点可以有多个 pod ，Kubernetes 主节点会自动处理在群集中的工作节点上调度 pod 。 主节点的自动调度考量了每个工作节点上的可用资源。

每个 Kubernetes 工作节点至少运行:

* Kubelet，负责 Kubernetes 主节点和工作节点之间通信的过程; 它管理 Pod 和机器上运行的容器。
* 容器运行时（如 Docker）负责从仓库中提取容器镜像，解压缩容器以及运行应用程序。

`kubectl get pods` 查看现有的 pods

`kubectl describe pods` 查 pod 中有哪些容器以及用于构建这些容器的镜像。

`kubectl descibe pods/<[pod name]>` 查看具体某个 pod。

`kubectl logs <pod name>` 查看 pod 日志

`kubectl exec <pod name> -- env` 在 pod 中执行 env 命令，就是普通的 Linux 命令，目标应该是该 pod 的容器

`kubectl exec -ti <pod name> -- bash` -it 这里应该是与 docker 类似，可交互控制台。

# 公开暴露应用

Kubernetes 的 Service 是一个抽象层，它定义了一组 Pod 的逻辑集，并为这些 Pod 支持外部流量暴露、负载平衡和服务发现。

Service 通过标签和选择器进行 Pod 分组匹配。

`kubectl get services` 获取正在运行的 Service。

暴露一个服务 `kubectl expose deployment/kubernetes-bootcamp --type="NodePort" --port 8080`，类型指定为 NodePort，minikube 不支持 LoadBalancer。

* ClusterIP (默认) - 在集群的内部 IP 上公开 Service 。这种类型使得 Service 只能从集群内访问。
* NodePort - 使用 NAT 在集群中每个选定 Node 的相同端口上公开 Service 。使用<NodeIP>:<NodePort> 从集群外部访问 Service。是 ClusterIP 的超集。
* LoadBalancer - 在当前云中创建一个外部负载均衡器(如果支持的话)，并为 Service 分配一个固定的外部 IP。是 NodePort 的超集。
* ExternalName - 通过返回带有该名称的 CNAME 记录，使用任意名称(由 spec 中的 externalName 指定)公开 Service。不使用代理。这种类型需要 kube-dns 的 v1.7 或更高版本。

部署完成后可通过 minikube 的 ip 地址 + 使用 `kubectl describe services/kubernetes-bootcamp` 中的 NodePort 中的端口进行访问。

`kubectl get pods -l app=kubernetes-bootcamp` 通过标签名获取 Pod。

`kubectl get services -l app=kubernetes-bootcamp` 通过标签名获取 service。

`kubectl label pod <pod name> version=v1` 为 pod 打上标签

`kubectl get pods -l version=v1` 通过-l 指令带上 label 获取 Pod。

`kubectl delete service -l app=kubernetes-bootcamp` 删除服务。

# 缩放应用

在运行 kubectl run 命令时，可以通过设置 --replicas 参数来设置 Deployment 的副本数。

`kubectl get rs` 查看副本

```shell
$ kubectl get rs
NAME                            DESIRED   CURRENT   READY   AGE
kubernetes-bootcamp-fb5c67579   1         1         1       36s
```

* 副本名字是按照[DEPLOYMENT-NAME]-[随机字符串]，类似 `kubernetes-bootcamp-fb5c67579`。
* DESIRED 显示所需的应用程序副本数，这些副本数是在创建 Deployment 时定义的。 这是所需的状态。
* CURRENT 显示当前正在运行多少个副本。

`kubectl scale deployments/kubernetes-bootcamp --replicas=4` 扩充为 4 个副本。

`kubectl get pods -o wide` 查看 pods。

`kubectl describe deployments/kubernetes-bootcamp` 查看 Deploment 信息，其中 Replicas 变更为 4 个。

# 更新应用

滚动更新允许通过使用新的实例逐步更新 Pod 实例从而实现 Deployments 更新，停机时间为零。

滚动更新允许以下操作：

* 将应用程序从一个环境提升到另一个环境（通过容器镜像更新）
* 回滚到以前的版本
* 持续集成和持续交付应用程序，无需停机

`kubectl set image deployments/kubernetes-bootcamp kubernetes-bootcamp=jocatalin/kubernetes-bootcamp:v2` set image 命令能更新镜像。通知 Deployment 为应用程序使用其他映像，并启动了滚动更新。

`kubectl rollout status deployments/kubernetes-bootcamp` 确认滚动状态。

`kubectl rollout undo deployments/kubernetes-bootcamp` 回滚更新。
