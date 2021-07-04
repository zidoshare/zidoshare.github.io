---
title: kubernetes学习笔记（7）- 部署一个微服务
createdDate: "2021-07-04"
updatedDate: "2021-07-04"
tags:
  - kubernetes
origin: true
draft: false
---

# 前言

上篇文章 [使用 kind 快速搭建集群](https://www.zido.site/blog/2021-07-03-kubernetes-kind/)中提到使用 kind 搭建好集群。

接下来写一个简单的微服务来进行验证，并尝试配置服务类型为 LoadBalancer 。

# 编写一个最简单的服务调用

在上篇文章中，编写了一个 `b-serv` 服务，它包含一个简单的`/hello`接口，并记录自己被调用的次数。本篇中它将作为微服务提供者(`b-serv`)而存在。

本次再添加一个 `a-serv`。

它的代码同样很简单，如下：

```go
package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"
)

func main() {
	rootCount := 0
	tr := &http.Transport{
		MaxIdleConns:       10,
		IdleConnTimeout:    3 * time.Second, //3 秒超时
		DisableCompression: true,
	}
	client := &http.Client{Transport: tr}
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		rootCount++
		fmt.Fprintf(w, "Hello! 我是 A 服务，我在集群中被调用了 %d 次\n", rootCount)
	})
	http.HandleFunc("/b", func(w http.ResponseWriter, r *http.Request) {
		resp, err := client.Get("http://b-serv/hello") // 远程调用 b-serv
		if err != nil {
			// 服务不可用
			log.Printf("b-serv 服务不可用：%s", err)
			fmt.Fprintln(w, "服务异常")
			return
		}
		defer resp.Body.Close()
		bytes, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			fmt.Fprintf(w, "Some thing error: %s\n", err)
		}
		w.Write(bytes)
	})
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

代码也是相当的简单，`a-serv` 提供两个接口，分别是 
* `/` 接口， 记录自身被调用时长
* `/b` 接口，远程调用 `b-serv`。具备最简单的服务降级。

Dockerfile 与 `b-serv`下的 Dockerfile 完全一致。

使用 docker 打包。`docker build -t github.com/zidoshare/b-serv:0.0.1`。

使用 `kind load docker-image github.com/zidoshare/b-serv:0.0.1` 加载镜像到 node 中。

编写部署配置文件：demo.yaml
```yaml
apiVersion: v1
kind: Service
metadata:
  name: a-serv
  namespace: demo
spec:
  type: NodePort
  selector:
    app: a-serv
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: a-serv-deployment
  namespace: demo
  labels:
    app: a-serv
spec:
  replicas: 3
  selector:
    matchLabels:
      app: a-serv
  template:
    metadata:
      labels:
        app: a-serv
    spec:
      containers:
      - name: a-serv
        image: github.com/zidoshare/a-serv:0.0.1
        ports:
        - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: b-serv
  namespace: demo
spec:
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

两个微服务全部都部署 3 个实例。 通过 k8s 部署多个实例完全不需要太多的操作。

使用 `kubectl apply -f demo.yaml` 应用配置文件，进行部署。

使用 `kubectl get pods -n demo` 查看目前正在运行的pods：
```
$ kubectl get pods -n demo
NAME                                 READY   STATUS    RESTARTS   AGE
a-serv-deployment-b4d787767-g8dtl    1/1     Running   0          107m
a-serv-deployment-b4d787767-q2xrf    1/1     Running   0          107m
a-serv-deployment-b4d787767-xfh74    1/1     Running   0          107m
b-serv-deployment-78556ddcc6-cszff   1/1     Running   0          107m
b-serv-deployment-78556ddcc6-qk9zz   1/1     Running   0          107m
b-serv-deployment-78556ddcc6-z7692   1/1     Running   0          106m
```

可以看到，应用已经按照预期运行。

查看服务：

```shell
$ kubectl get svc -n demo
NAME     TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
a-serv   NodePort   10.96.129.146   <none>        80:30235/TCP   136m
b-serv   NodePort   10.96.75.216    <none>        80:31093/TCP   143m
```

此时 a 服务通过 NodePort 进行暴露，与之前访问 `b-serv` 一样，通过 node 的 internet ip 访问即可（具体怎么看，请参考上一篇）：

```shell
$ curl http://172.18.0.4:30235/
Hello! 我是 A 服务，我在集群中被调用了 9 次
$ curl http://172.18.0.4:30235/b
B 服务就是我，我在集群中被调用了 8 次
```

分别验证了`a-serv`和 `a-serv` 调用 `b-serv`。可以发现完全通了。

此时如果你使用 LoadBalancer 来暴露服务，通过 `kubectl get svc -n demo` 或发现`externalIp` 始终处于 pending 状态。这是因为我们还没有负载均衡实现。

# 通过 LoadBalancer 暴露微服务

通过 k8s 的文档可以知道， LoadBalancer 是由具体的云服务提供商来提供的，k8s并没有本地的实现。那么如何实现本地部署 LoadBanlancer 服务类型呢？此时，就需要 `metallb` 来提供了。

查看 [metallb 官网](https://metallb.universe.tf/)。它是一个裸金 k8s 集群的负载均衡实现。也就是说，它可以实现本地的 loadBalancer 服务，而不需要云服务商提供。

通过 kind 文档发现，安装及其方便。

创建 metallb namespace
```
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/master/manifests/namespace.yaml
```
创建 secret
```
kubectl create secret generic -n metallb-system memberlist --from-literal=secretkey="$(openssl rand -base64 128)"
```

部署 metallb
```
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/master/manifests/metallb.yaml
```

通过 `kubectl get pods -n metallb-system` 发现启动了两个pod:
```shell
$ kubectl get pods -n metallb-system
NAME                          READY   STATUS    RESTARTS   AGE
controller-6dd9986f57-q2bkr   1/1     Running   0          155m
speaker-wt592                 1/1     Running   0          155m
```

要让 loadbalancer 暴露服务，首先我们需要有一个 Ip 地址池，用于 loadBanalcer 服务暴露，而这需要有 kind来分配，使用以下命令查看 kind分配的地址：
```
$ docker network inspect -f '{{.IPAM.Config}}' kind
[{172.18.0.0/16  172.18.0.1 map[]} {fc00:f853:ccd:e793::/64   map[]}]
```
你会得到类似 `172.18.0.0/16` 这样的输出，每个人遇到的情况可能有所不同。

接下来我们为 metallb 选择一个范围。分配50的地址，应该足够了: 172.18.255.200 到 172.18.255.250。
编写配置metallb-configmap.yaml：
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  namespace: metallb-system
  name: config
data:
  config: |
    address-pools:
    - name: default
      protocol: layer2
      addresses:
      - 172.18.255.200-172.18.255.250

```

运行 `kubectl apply -f metallb-configmap.yaml`。

做完简单的一切之后，我们尝试使用 loadBalancer。直接`kubectl edit svc a-serv -n demo`。找到 `type: NodePort` 直接修改为: `type: LoadBalancer`。

查看服务列表：
```shell
$ kubectl get svc -n demo
NAME     TYPE           CLUSTER-IP      EXTERNAL-IP      PORT(S)        AGE
a-serv   LoadBalancer   10.96.129.146   172.18.255.200   80:30235/TCP   171m
b-serv   NodePort       10.96.75.216    <none>           80:31093/TCP   179m
```
此时有了 externalIp 。我们就可以直接访问该IP，从而访问a 服务啦。
```shell
$ curl http://172.18.255.200
Hello! 我是 A 服务，我在集群中被调用了 10 次
$ curl http://172.18.255.200
Hello! 我是 A 服务，我在集群中被调用了 6 次
$ curl http://172.18.255.200
Hello! 我是 A 服务，我在集群中被调用了 7 次
```

而且具有负载均衡的效果。