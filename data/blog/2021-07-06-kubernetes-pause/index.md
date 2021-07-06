---
title: pause 容器
createdDate: "2021-07-06"
updatedDate: "2021-07-06"
tags:
  - kubernetes
origin: true
draft: false
---
# 概述

通过[容器资源隔离的原理](https://www.zido.site/blog/2021-06-01-container-resource/)中知道容器之间是通过 NameSpace 和 cgroups 隔离开的，但是 pod 中的网络和存储却是共享的.

kubernetes 为了解决网络共享问题，引入了 pause 容器，又叫Infra容器，在kubelet的配置中有KUBELET_POD_INFRA_CONTAINER参数，它的默认配置是：
```
KUBELET_POD_INFRA_CONTAINER=--pod-infra-container-image=gcr.io/google_containers/pause-amd64:3.0
```
而 pause 的代码可见[Github](https://github.com/kubernetes/kubernetes/tree/master/build/pause)

# 网络共享实现原理

只看[linux部分](https://github.com/kubernetes/kubernetes/blob/master/build/pause/linux/pause.c#L64-L65)。

非常简单，我直接把它贴出来

```c
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

#define STRINGIFY(x) #x
#define VERSION_STRING(x) STRINGIFY(x)

#ifndef VERSION
#define VERSION HEAD
#endif

static void sigdown(int signo) {
  psignal(signo, "Shutting down, got signal");
  exit(0);
}

static void sigreap(int signo) {
  while (waitpid(-1, NULL, WNOHANG) > 0)
    ;
}

int main(int argc, char **argv) {
  int i;
  for (i = 1; i < argc; ++i) {
    if (!strcasecmp(argv[i], "-v")) {
      printf("pause.c %s\n", VERSION_STRING(VERSION));
      return 0;
    }
  }

  if (getpid() != 1)
    /* Not an error because pause sees use outside of infra containers. */
    fprintf(stderr, "Warning: pause should be the first process\n");

  if (sigaction(SIGINT, &(struct sigaction){.sa_handler = sigdown}, NULL) < 0)
    return 1;
  if (sigaction(SIGTERM, &(struct sigaction){.sa_handler = sigdown}, NULL) < 0)
    return 2;
  if (sigaction(SIGCHLD, &(struct sigaction){.sa_handler = sigreap,
                                             .sa_flags = SA_NOCLDSTOP},
                NULL) < 0)
    return 3;

  for (;;)
    pause();
  fprintf(stderr, "Error: infinite loop terminated\n");
  return 42;
}
```

按照主流程看：

* -v 输出版本号 （不看）
* `if(getpid() !=1)` 确保自己是 pid为 1 的进程。（warning）
* 检查 `SIGINT` 和`SIGTERM`信号，收到此信号关闭应用（ctrl-c之类的）
* 检查 `SIGCHLD`，当子进程停止(ctrl-z之类的行为)或终结(kill之类的行为)时，调用`waitpid`方法收割僵尸进程
* 然后一直暂停(循环调用`pause()`)。

> `waitpid`函数的作用： 收割僵尸进程。 -1 表示所有子进程，WNOHANG表示没有子进程被退出就立即返回。
> `pause` 函数的作用为：使调用进程（线程）进入休眠状态（就是挂起）；直到接收到信号且信号函数成功返回 pause函数才会返回。

发现主要有两部分功能：

* 承担PID 1的角色，它将通过调用wait来收割这些僵尸进程（见sigreap）。保证不会有僵尸堆积在Kubernetes pods的PID命名空间中。
* 让 **pause 容器一直处于暂停状态**。

有了这个不退出的容器之后， 其它所有的容器就可以利用 `Join Namespace` 这个特性，加入到 pause container 的 NetWork Namespace 中。

此时，所有容器的网络试图就完全一样了，他们看到的都是 pause container 的网络视图，例如 网络设备、IP 地址、Mac 地址等等。

当然了，这也就要求其它容器必须在 pause 容器之后启动。同时，其它任何容器做重建之类操作，整个pod 也不会重启，因为 pause 容器一直存在。
