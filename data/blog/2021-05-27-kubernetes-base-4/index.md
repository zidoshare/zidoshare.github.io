---
title: kubernetes学习笔记（4）-k8s+CRI-O安装单节点安装记录（国内网络）
createdDate: "2021-05-27"
updatedDate: "2021-05-27"
tags:
  - kubernetes
origin: true
draft: false
---

# 前言

本文主要介绍安装的版本时kubernetes 1.18，而当前最新版本为1.21。但因内部项目原因，暂时以安装1.18为主。但同时也尝试了1.21，但因国内网络等原因，暂时未能安装成功，暂时留下疑问，等待以后解决（或希望有大佬能告知）。

# 安装CRI-O

CRI是Kubernetes推出的**容器运行时接口**(Container Runtime Interface)。可以让kubelet使用不同的兼容OCI容器运行时。

CRI-O项目是一个轻量级运行时。

官网标准流程戳[CRI-O](https://kubernetes.io/docs/setup/production-environment/container-runtimes/#cri-o)。

安装前需要配置：
```shell
# Create the .conf file to load the modules at bootup
cat <<EOF | sudo tee /etc/modules-load.d/crio.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter

# Set up required sysctl params, these persist across reboots.
cat <<EOF | sudo tee /etc/sysctl.d/99-kubernetes-cri.conf
net.bridge.bridge-nf-call-iptables  = 1
net.ipv4.ip_forward                 = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOF

sudo sysctl --system
```
我所使用的服务器Linux为CentOS7的衍生版本。

```shell
# 这里的VERSION为CRI-O版本，CRI-O版本是跟随kubernetes的。如果需要特定小版本，可以设置为 VERSION=1.18:1.18.3
export VERSION=1.18
# 根据系统版本选择，我是CentOS7的衍生版本
export OS=CentOS_7

curl -L -o /etc/yum.repos.d/devel:kubic:libcontainers:stable.repo https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/$OS/devel:kubic:libcontainers:stable.repo

curl -L -o /etc/yum.repos.d/devel:kubic:libcontainers:stable:cri-o:$VERSION.repo https://download.opensuse.org/repositories/devel:kubic:libcontainers:stable:cri-o:$VERSION/$OS/devel:kubic:libcontainers:stable:cri-o:$VERSION.repo

yum install cri-o
```

启动CRI-O

```shell
systemctl daemon-reload
systemctl enable crio --now
```

安装CRI-O之后，因国内网络原因，需要修改内部镜像源。

* \[可选\] 编辑 `/etc/sysconfig/crio`文件，内部可以添加`http_proxy`，`https_proxy`，`no_proxy`环境变量用于网络访问。
* 编辑`/etc/crio/crio.conf`文件，设置[crio.runtime]下`"cgroup_manager"` 为 `systemd`，设置[crio]下`storage_driver` 修改为 `"overlay2"`。这其中v1.21和1.18的预设配置就不一样，1.21没有预设配置，需要添加。
* 编辑`/etc/containers/registries.conf`
```toml
unqualified-search-registries = ['registry.access.redhat.com', 'docker.io', 'registry.fedoraproject.org', 'quay.io', 'registry.centos.org']

[[registry]]
prefix = "k8s.gcr.io"
insecure = false
blocked = false
location = "registry.aliyuncs.com/google_containers"

[[registry.mirror]]
location = "docker.mirrors.ustc.edu.cn"
```
如果启动报错（我尝试了一下，1.18和最新版本都会），需要注释掉`[[registry.search]]`下的配置。
* 修改`/etc/containers/storage.conf`，设置`[storage]`下的`drvier`为 `"overlay2"`
* 删除 /etc/cni/net.d 文件夹下的所有文件，确保 CRI-O 稍后使用 calico 作为 CNI 插件（安装完后默认是配置使用 bridge 作为 CNI 插件，只能联通本机，不满足 K8s 网络要求）
```shell
rm -f /etc/cni/net.d/*
```
* 配置 systemd，重新加载 crio 服务并保证其每次开机自运行。
```shell
systemctl daemon-reload
systemctl enable crio
systemctl restart crio
```

# 安装kubeadm、kubelet、kubectl

标准流程戳[这里](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/#installing-kubeadm-kubelet-and-kubectl)。

因版本太新，我需要选择固定版本，因此选择了阿里云镜像。

```shell
cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF
setenforce 0

sed -i 's/^SELINUX=enforcing$/SELINUX=permissive/' /etc/selinux/config

yum install -y kubelet kubeadm kubectl --disableexcludes=kubernetes

systemctl enable --now kubelet
```

安装完成后替换 /etc/sysconfig/kubelet 文件内容；

```shell
KUBELET_EXTRA_ARGS=--cgroup-driver=systemd --container-runtime=remote --container-runtime-endpoint="unix:///var/run/crio/crio.sock"
```
重启kubelet
```shell
systemctl daemon-reload
systemctl stop kubelet
systemctl enable kubelet --now
```

# 初始化

这里按需配置参数
```
kubeadm init
```

