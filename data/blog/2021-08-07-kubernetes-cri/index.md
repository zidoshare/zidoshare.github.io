---
title: kubernetes CRI 容器运行时标准介绍
createdDate: "2021-08-07"
updatedDate: "2021-08-07"
tags:
  - kubernets
  - cri
origin: true
draft: false
---

# 由来

在容器运行时接口未定义前， kubernetes 的容器运行时是内嵌的，例如最初是通过 dockershim 来调用 docker 从而操作容器。而加入其他容器运行时也需要内嵌相应代码到 kubernetes 仓库中，导致代码庞大难以维护。

于是在 <https://github.com/kubernetes/kubernetes/issues/13768> 中，有人提出了需要抽象一个容器运行时接口，从而实现代码解耦，所有的容器运行时只需要实现这个接口，就能够接入到整个 kubernetes 生态中，从此 CRI（Container Runtime Interface） 应运而生。

正式发布是在 v1.5 版本，这可以从 kubernetes 的 [changelog-1.5](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.5.md) 中找到。

# CRI 标准基本逻辑

容器运行时接口通过 grpc 协议通信的。它的仓库在 <https://github.com/kubernetes/cri-api> 中。相关 protobuf 在 `pkg/apis/runtime/v1alpha2/api.proto` 中，可以很清晰的看到所有的请求接口。

目前最新可用的标准接口定义版本一直维持在 `v1alpha2` 版本。并且几乎一直没什么改动，也就是说通过这个接口可以从 kubernetes v1.5 至少兼容到最新版本（目前为 v1.22）。

可以通过 grpc 对实现 CRI 标准的运行时进行调用，在这之前我们要知道运行时的 endpoint，例如 kubernetes 之前一直用的 dockershim（`unix:///var/run/dockershim.sock`）、containerd(`unix:///run/containerd/containerd.sock`)以及后来官方的 CRI 标准实现 cri-o(`unix:///run/crio/crio.sock`)，下面是一个简单的例子：
```go
package main

import (
	"context"
	"fmt"
	"net"
	"net/url"

	"google.golang.org/grpc"
	pb "k8s.io/cri-api/pkg/apis/runtime/v1alpha2"
)

func main() {
	//一般是用户输入或配置
	runtimeEndpoint := "unix:///run/crio/crio.sock"

	u, err := url.Parse(runtimeEndpoint)
	if err != nil {
		panic(err)
	}
	dialer := func(ctx context.Context, addr string) (net.Conn, error) {
		return (&net.Dialer{}).DialContext(ctx, "unix", addr)
	}
  // u.Path = run/crio/crio.sock 上面是为了体现一般都是这么解析的命令行参数
	conn, err := grpc.Dial(u.Path, grpc.WithInsecure(), grpc.WithBlock(), grpc.WithContextDialer(dialer))
	if err != nil {
		panic(err)
	}
  //client 分为 RuntimeServiceClient 和 NewImageServiceClient
	runtimeClient := pb.NewRuntimeServiceClient(conn)
  //不要忘记关闭连接，当然，这个连接是可以重用的。不用每次都关闭
	defer func() {
		conn.Close()
	}()
  //发送 Version 请求
	request := &pb.VersionRequest{Version: "v1alpha2"}
	r, err := runtimeClient.Version(context.Background(), request)
	if err != nil {
		panic(err)
	}
	fmt.Println("Version: ", r.Version)
	fmt.Println("RuntimeName: ", r.RuntimeName)
	fmt.Println("RuntimeVersion: ", r.RuntimeVersion)
	fmt.Println("RuntimeApiVersion: ", r.RuntimeApiVersion)
}
```

如果没有意外，那么将会打印：

```
Version:  0.1.0
RuntimeName:  cri-o
RuntimeVersion:  1.22.0
RuntimeApiVersion:  v1alpha2
```

除了简单的 Version 请求，CRI 几乎可以处理容器运行时的所有事情。可以去 <https://github.com/kubernetes/cri-api> 中查看所有信息。 kubernetes 的 [cri-tools](https://github.com/kubernetes-sigs/cri-tools) 就是封装了接口的命令行工具。


