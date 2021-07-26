---
title: cgroups v1简介
createdDate: "2021-07-16"
updatedDate: "2021-07-26"
tags:
  - kubernetes
origin: true
draft: false
---

# cgroup 概念
Cgroup，全称Control Group（控制组），是Linux系统内核提供的一个特性（Linux 2.6.24内核开始将Cgroup加入主线）。

主要作用：

* 限制和隔离一组进程对系统资源的使用，也就是做资源QoS。可控制的资源主要包括CPU、内存、block I/O、网络带宽等等。
* 资源统计，可以统计资源使用量，比如CPU使用时长、内存使用量。
* 对进程组执行挂起、恢复。

cgroup是虽然是内核提供的功能，但是我们事实上可以不通过内核就能够轻松操作。

linux使用虚拟文件系统来为用户提供相关的接口。这也符合linux内`一切皆文件`的宗旨。

通过 `man cgroups` 命令可以在Linux中看到相关的概念。

可以将任意cgroups子系统挂载到指定的目录。与mount一致，只不过需要指定类型为 cgroup。

```
mount -t cgroup -o cpu,cpuacct none /sys/fs/cgroup/cpu,cpuacct

umount /sys/fs/cgroup/pids
```

在目前，默认情况下，一般会由`systemd`自动挂载到`/sys/fs/cgroup`中。

可以通过 `ls /sys/fs/cgroup`看到各个文件夹。这就是挂载的资源管理器
```shell
# ls /sys/fs/cgroup/
blkio  cpu  cpu,cpuacct  cpuacct  cpuset  devices  freezer  hugetlb  memory  net_cls  net_cls,net_prio  net_prio  perf_event  pids  systemd
```

## subsystem(子系统)

cgroup 按照资源包含很多的子系统。

1. cpu 子系统，主要限制进程的 cpu 使用率。
2. cpuacct 子系统，可以统计 cgroups 中的进程的 cpu 使用报告。
3. cpuset 子系统，可以为 cgroups 中的进程分配单独的 cpu 节点或者内存节点。
4. memory 子系统，可以限制进程的 memory 使用量。
5. devices 子系统，可以控制进程能够访问某些设备。
6. freezer 子系统，可以挂起或者恢复 cgroups 中的进程。
7. net_cls 子系统，可以标记 cgroups 中进程的网络数据包，然后可以使用 tc 模块（traffic control）对数据包进行控制。
8. blkio 子系统，可以限制进程的块设备 io。
9. pref_event 子系统，Cgroups中的进程监控。
10. net_prio 子系统，Cgroups中的网络优先级。
11. hugetlb 子系统，巨页（大内存页）限制。
12. pids 子系统，进程数量限制。
13. rdma 子系统，限制 RDMA/IB 特殊资源使用。

> 不过并不一定你的 linux 就有这些子系统，它们是在不同版本的内核中加入的。

## cgroup(组)

除了**子系统**之外，还需要了解 group 的概念，在 cgroups 中，资源都是以组为单位控制的，每个组包含一个或多个的子系统。你可以按照任何自定义的标准进行组的划分。划分组之后，你可以将任意的进程加入、迁移到任意组中并且实时生效（但是对于进程的子进程不影响）。

## hierarchy(层级树)

一组以树状结构排列的cgroup就是hierarchy(层级树)，结合虚拟文件系统来理解，通过创建、删除、重命名子目录来定义层次结构。子目录能够继承父目录的全部资源（当然了，不能超过），也可以基于父目录的资源限制进行进一步的资源大小限制。父目录如果调整了资源大小，子目录同样会马上受到影响。

每个层级树可以关联任意个数的subsystem，但是每个subsystem最多只能被挂在一颗树上。

# cgroup 简单操作

如果在对应子系统目录下创建目录，则会自动生成子文件结构。
mkdir /sys/fs/cgroup/cpu/cg1

看起来像这样：

```shell
# ls -l /sys/fs/cgroup/cpu/cg1
total 0
-rw-r--r--. 1 root root 0 Jul  7 08:22 cgroup.clone_children
--w--w--w-. 1 root root 0 Jul  7 08:22 cgroup.event_control
-rw-r--r--. 1 root root 0 Jul  7 08:22 cgroup.procs
-rw-r--r--. 1 root root 0 Jul  7 08:22 cpu.cfs_period_us
-rw-r--r--. 1 root root 0 Jul  7 08:22 cpu.cfs_quota_us
-rw-r--r--. 1 root root 0 Jul  7 08:22 cpu.rt_period_us
-rw-r--r--. 1 root root 0 Jul  7 08:22 cpu.rt_runtime_us
-rw-r--r--. 1 root root 0 Jul  7 08:22 cpu.shares
-r--r--r--. 1 root root 0 Jul  7 08:22 cpu.stat
-r--r--r--. 1 root root 0 Jul  7 08:22 cpuacct.stat
-rw-r--r--. 1 root root 0 Jul  7 08:22 cpuacct.usage
-r--r--r--. 1 root root 0 Jul  7 08:22 cpuacct.usage_percpu
-rw-r--r--. 1 root root 0 Jul  7 08:22 notify_on_release
-rw-r--r--. 1 root root 0 Jul  7 08:22 tasks
```

接下来尝试限制cpu使用率
关于cpu相关参数可查阅：[https://access.redhat.com/documentation/zh-cn/red_hat_enterprise_linux/7/html/resource_management_guide/sec-cpu](https://access.redhat.com/documentation/zh-cn/red_hat_enterprise_linux/7/html/resource_management_guide/sec-cpu)
> 这个网站是我目前找到的最详细的中文文档了。。。


编写一个简单的java程序：
```java
public class Demo {
    public static void main(String[] args) {
        for( int i = 0; i < 10; i++) {
            new Thread(() -> {
                while(!Thread.currentThread().isInterrupted()) {
                    System.out.println("hello");
                }
            }).start();
        }
    }
}
```
直接运行可看到cpu使用率为100%:

```
   PID USER      PR  NI    VIRT    RES    SHR S %CPU %MEM     TIME+ COMMAND
  4073 root      20   0 2261340  32440  12404 S 91.7  3.3   1:24.41 java
```

先编辑一下cgroup的cpu使用率

```shell
echo 10000 > cpu.cfs_quota_us 
echo 50000 > cpu.cfs_period_us
```
`cpu.cfs_quota_us` 代表每个时间片某一阶段（由 `cpu.cfs_period_us` 规定）某个 cgroup 中所有任务可运行的时间总量，单位为微秒（µs，这里以 "us" 代表）

所以设置每50ms的时间片中可以使用10ms。这也就是cpu的20%的算力

向 cgroup.procs 写入进程id `4073`
echo 4073 > /sys/fs/cgroup/cpu/cgroup.procs

在使用top看一下cpu使用率，结果如下，可以发现cpu的使用率基本是不超过20%的。
```
   PID USER      PR  NI    VIRT    RES    SHR S %CPU %MEM     TIME+ COMMAND
  4073 root      20   0 2261340  30840  10524 S 19.9  3.1   7:08.51 java
```

其他诸如内存等限制，都可以查阅文档进行限制。

# 总结

cgroup 是容器化的基石之一，但是实际上它的使用并没有多么的复杂，凭借 cgroup 我们可以轻松的实现任意资源的限制。 事实上，它不仅仅可以帮助我们容器化，即使是在我们的普通业务中，也是可以使用的。

比如我们的某个服务是比较费资源的服务，例如爬虫，我们不可能希望这样一个服务直接把我们的一台服务器全部跑满，因为可能需要一些资源来做其他的事情，那么我们就可以将进程移动到我们的资源组中，从而限制它的使用率。
