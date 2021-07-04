---
title: kubernetes学习笔记（6）- 使用 kind 快速搭建集群
createdDate: "2021-07-04"
updatedDate: "2021-07-04"
tags:
  - kubernetes
origin: true
draft: false
---

# 概述

如果你因一些原因(<del>囊中羞涩</del>)无法完整的体验一个k8s集群， 你应该尝试一下 kind。它的优势：

* 快速简单的创建 k8s 集群
* 可直接创建多节点集群（支持 control-plane 高可用）
* 可选择 k8s 版本安装
* 支持 windows/linux/macos 三平台

它仅仅需要你：

* 装好 docker
* 装好 golang(>= 1.11)
* 装好 kubectl
* 国内需要配置镜像(<del>骑墙应该是基本操作了吧</del>)

# 快速开始

使用以下命令安装 kind ，并创建一个默认集群。

```
GO111MODULE="on" go get sigs.k8s.io/kind@v0.11.1 && kind create cluster
```

使用 `kind get clusters` 可看到已创建一个集群：

```shell
$ kind get clusters
kind
```

使用 `--name` 选项可命名集群，也就是说你可以创建多个集群
```
kind create cluster --name demo
```

# 创建多节点集群

默认情况下，你创建的是单节点集群，如果需要创建多节点集群也非常简单。

编写一个 config： example-config.yaml

```
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
- role: control-plane
- role: control-plane
- role: worker
- role: worker
- role: worker
```

然后使用 `kind create cluster --config example-config.yaml --name demo-1` 即可快速创建集群。

```
$ kind create cluster --config example-config.yaml --name demo-1
$ kind get clusters
demo-1
kind
```

# 基本使用

## 使用 kubectl 连接不同集群

默认情况下，`kubectl` 所连接的集群是第一个创建的集群，而如果我们有多个集群，则需要使用 
```
kubectl --context kind-demo-1
```
来进行连接。查看 kubeconfig 文件可以发现这一原因，打开`$HOME/.kube/config`，会发现 `kind` 将所有集群配置全部写进去了，通过 context 作为区分，注意这里 context 的名称以 `kind-` 作为前缀。

## kind 常用命令

* 查看集群列表： `kubectl get clusters`
* 删除集群: `kind delete cluster --name xxx`
* 创建集群: `kind create --name xxx`
* 将 docker 镜像加载到 kind 集群节点中： `kind load docker-image 镜像名:版本`

# 部署一个示例服务

我编写了一个简单的服务：

```go
package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	count := 0
	http.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
		count++
		fmt.Fprintf(w, "B 服务就是我，我在集群中被调用了 %d 次", count)
	})
	log.Fatal(http.ListenAndServe(":8080", nil))
}

```

我命名其为 `b-serv` 。使用 docker 构建， Dockerfile如下：


```
FROM golang:1.16 as build
ENV GOPROXY https://goproxy.cn
WORKDIR /b-serv/
COPY go.mod .
RUN go mod download
COPY *.go .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app .

FROM scratch as prod
WORKDIR /b-serv/
COPY --from=build /b-serv/app .
CMD ["./app"]
```

使用命令 `docker build -t github.com/zidoshare/b-serv:0.0.1 .` 进行构建。

构建完成后，我们不需要上传远程仓库，直接使用 `kind load docker-image github.com/zidoshare/b-serv:0.0.1` 加载进集群中。

编写服务配置文件：

```yaml
---
apiVersion: v1
kind: Namespace
metadata:
  name: demo
---
apiVersion: v1
kind: Service
metadata:
  name: b-serv
  namespace: demo
spec:
  type: NodePort
  selector:
    app: b-serv
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: b-serv-deployment
  namespace: demo
  labels:
    app: demo-serv
spec:
  replicas: 3
  selector:
    matchLabels:
      app: b-serv
  template:
    metadata:
      labels:
        app: b-serv
    spec:
      containers:
      - name: b-serv
        image: github.com/zidoshare/b-serv:0.0.1
        ports:
        - containerPort: 8080
```

然后使用 `kubectl apply -f b-serv.yaml` 就完成了部署，非常的简单。

查看 pod 状态：
```shell
$ kubectl get pods -n demo
NAME                                 READY   STATUS    RESTARTS   AGE
b-serv-deployment-78556ddcc6-cszff   1/1     Running   0          62m
b-serv-deployment-78556ddcc6-qk9zz   1/1     Running   0          63m
b-serv-deployment-78556ddcc6-z7692   1/1     Running   0          62m
```

通过 NodePort 暴露了服务，我们直接使用 node 的 ip即可验证。

通过 `kubectl describe node` 可看到`InternalIP:  172.18.0.4`
 node 的 ip 为 172.18.0.4。

查看服务列表：

```shell
$ kubectl get svc -n demo
NAME     TYPE           CLUSTER-IP      EXTERNAL-IP      PORT(S)        AGE
b-serv   NodePort       10.96.75.216    <none>           80:31093/TCP   101m
```
验证一下通不通：
```shell
$ curl http://172.18.0.4:31093/hello
B 服务就是我，我在集群中被调用了 1 次#
```

非常通透，若多次调用，还会发现在三个实例中做了负载均衡，k8s真香。

# 最后

kind 可以说作为一个学习工具实在是太方便了！！！

查阅官方文档，发现还支持 LoadBalancer，我命名这个服务是 `b-serv` 大概也能猜到了，因为我要做一个微服务集群来学习，这只是一个后端服务，还会有 `a-serv` 之类的。 下篇文章会使用 LoadBalancer 来暴露我的微服务。

有一个小问题是，kind 无法动态修改集群配置，所以需要提前想好集群怎么搭配。不过小开销可搭建那么多集群，这简直是最小不过的问题了。