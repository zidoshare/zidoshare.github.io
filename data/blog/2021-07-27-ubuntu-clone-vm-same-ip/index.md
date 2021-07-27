---
title: 解决Ubuntu 20.04 虚拟机克隆出多台造成的IP地址冲突的问题
createdDate: "2021-07-27"
updatedDate: "2021-07-27"
tags:
  - vmware
origin: true
draft: false
---

# 先上解决方案

在被克隆的机器上编辑 `/etc/netplan/00-installer-config.yaml` 文件。
```
network:
  ethernets:
    ens33:
      dhcp4: true
      dhcp-identifier: mac # 加上这一行。
  version: 2
```

这样每次从这台机器进行的克隆都会有唯一的 ip 地址。

# 简单说明

如果是 clone centos 会发现不会出现这一情况，而 clone ubuntu 的时候会发生，那么可以简单的猜测，可能是因为网络策略的不同。

经过一番查询发现：

* Ubuntu 网络组件使用 `systemd-networkd` 。
* Centos 网络组件使用 `dhclient`。

这就是他们默认策略不同的原因， `systemd-networkd` 默认使用 `/etc/machine-id` 来识别，当虚拟机克隆的时候，他们都有一样的 `/etc/machine-id` 和 `DHCP` server，因此返回的都是同一个 ip 了。

而 Centos 所使用的 `dhclient` 组件，采用默认策略就是使用**链路层地址**，虽然虚拟机进行了文件克隆，但是他们的链路层地址是由虚拟机进行分配的所以并不一样。


# 参考

* [Why are my cloned linux VMs fighting for the same IP](https://unix.stackexchange.com/questions/419321/why-are-my-cloned-linux-vms-fighting-for-the-same-ip)
* [dhclient](https://manpages.debian.org/jessie/isc-dhcp-client/dhclient.8.en.html)
* [systemd-networkd](https://manpages.debian.org/buster/systemd/systemd-networkd.8.en.html)