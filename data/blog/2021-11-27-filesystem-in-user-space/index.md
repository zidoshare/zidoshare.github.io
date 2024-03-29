---
title: 用户态文件系统详解
createdDate: "2021-11-27"
updatedDate: "2022-01-09"
tags:
  - fuse
  - containers
origin: true
draft: false
image: header.jpg
---

## 用户态文件系统介绍

顾名思义，用户态文件系统就是运行在用户空间的文件系统，众所周知，在宏内核系统（像 Linux），文件系统代码都在内核中，典型的例子是想要挂载一个磁盘，你必须使用 Root 权限运行 `mount` 指令才行，而矛盾的地方在于，内核的发展是极其缓慢的，但是人们对定制文件系统的需求又日益剧增。于是 Linux 从 2.6.14 版本开始，支持了一个叫 FUSE 的内核模块。

FUSE (全称：Filesystem In Userspace.用户空间中的文件系统)是用户空间程序将文件系统导出到 Linux 内核的接口。FUSE 项目由两个组件组成：FUSE 内核模块(在常规内核存储库中维护)和用户空间库([libfuse](https://github.com/libfuse/libfuse))。

> [libfuse](https://github.com/libfuse/libfuse) 也只是建议的参考实现，你也可以自行实现。

### 为什么一定要是**用户态**

* 不需要使用 root 用户去 mount 文件系统，如果你是非系统管理员，也能够 mount 一个用户态的文件系统。这催生了著名的 [fuse-overlayfs](https://github.com/containers/fuse-overlayfs)，其在 rootless 容器化中扮演重要的角色，事实上 docker 当年一定要 root 守护进程的一个重要原因就是没有合适的用户态堆叠文件系统，导致架构不得不妥协，从而带来严重的安全隐患，再后来随着用户态文件系统的发展，docker 19.03 终于实验性地支持 rootless 模式
* 你不再需要去修改内核就能**快速**实现一个文件系统，例如非常著名的 [sshfs](https://github.com/libfuse/sshfs)，只要能连接 ssh ，你就能直接挂载一个远程的文件系统。FUSE 已经帮你做了很多的事情，你只需要专注于定制文件系统的基本逻辑即可。

### 用户态文件系统并不那么**用户态**

用户态文件系统并不那么的用户态，因为你的代码并不是真正在用户态去访问文件系统，它其实只是一层代理，当调用文件系统时，最先进去的仍然是 VFS,真正的文件 IO 操作最终还是由内核实现，而在用户态能做的，是作为一个守护进程，将内核传递的 fuse request 经由用户态进行处理，再调用 vfs 让内核去写数据。结构图如下：

![fuse-structure](./fuse-structure.jpg)

但是这样的设计对于用户开发是有极大好处的：

* 用户无需关心文件系统底层细节，只需与 VFS 交互即可实现一个文件系统。
* 用户态崩溃不会影响到内核。
* 你只需要遵循协议，可以使用任意语言实现。

## libfuse 的简单使用

libfuse 作为于内核 FUSE 模块通信的参考实现，其封装了所有内核请求。它将对用户暴露的 API 分为 `low_level_api` 和 `high_level_api`，分别是:
* [fuse.h](https://github.com/libfuse/libfuse/blob/master/include/fuse.h)，它是 lowlevel api 的再封装，基本屏蔽了大部分复杂性，只需要实现一部分 api 即可实现一个用户态文件系统，但是性能表现一般。大部分应用都不会选择使用 high level api 进行开发，毕竟用户态文件系统性能非常关键。
* [fuse_lowlevel.h](https://github.com/libfuse/libfuse/blob/master/include/fuse_lowlevel.h) ，它是内核调用的浅封装转发，可控性更高，性能更好，但是需要对源码以及文件系统机制有一定了解。


我们使用 libfuse 官方的 [hello.c](https://github.com/libfuse/libfuse/blob/master/example/hello.c) 来测试一个小 demo，它就是使用 `high_level_api` 开发的：

```shell
$ gcc -Wall hello.c `pkg-config fuse3 --cflags --libs` -o hello
$ mkdir demo
$ ./hello demo
$ ls ./demo
hello
$ ls -al ./demo
drwxr-xr-x .
drwxr-xr-x ..
.r--r--r-- hello
$ cat ./demo/hello
Hello World!
$ touch ./demo/index.txt
touch: cannot touch './demo/index.txt': Function not implemented
$ echo 'a' > ./demo/hello
zsh: permission denied: ./demo/hello
$ fusermount -u ./demo
```

可以看到，代码自己模拟了一个叫 hello 的文件，并且可以读取其中的内容，但是无法写入，也无法在其中创建文件。

它的 `fuse_ops` 仅有几个有限的实现。
```c
static const struct fuse_operations hello_oper = {
	.init           = hello_init,
	.getattr	= hello_getattr,
	.readdir	= hello_readdir,
	.open		= hello_open,
	.read		= hello_read,
};
```

通过 `fuse_main` 函数将 `fuse_operations` 传递到 `libfuse` 后，即可自动实现 daemon 化，大大缩减了开发成本，你仅需要关心几个有限的 `fuse_operations` 即可。

## fuse 基本原理

FUSE 模块其实是一个简单的客户端-服务器协议，它的客户端是内核，用户态的守护进程就是服务端，内核模块会通过 vfs 暴露一个 /dev/fuse 的设备文件：
```shell
$ ls -l /dev/fuse
crw-rw-rw- root root 0 B Thu Nov 18 22:24:32 2021 /dev/fuse
```

这即是我们与 FUSE 内核模块交流的纽带。在我们的用户空间代码中，通过调用 open 函数获得文件描述符，凭此来读取请求并且写入响应来完成一次 IO 调用。不过需要注意的是，这个设备每次打开都会有一个不同的 session,第二次调用 open 的时候并不能访问到第一次调用 open 的资源。

仍然以上面的`hello`为例，我们使用 `strace ./hello ./demo` 来看一下做了那些系统调用：

```shell
...
openat(AT_FDCWD, "/dev/fuse", O_RDWR|O_CLOEXEC) = 3'
...
mount("hello", "/home/zido/Projects/c/hello-fuse/demo", "fuse.hello", MS_NOSUID|MS_NODEV, "fd=3,rootmode=40000,user_id=1000"...) = -1 EPERM (Operation not permitted)
...
clone(child_stack=NULL, flags=CLONE_CHILD_CLEARTID|CLONE_CHILD_SETTID|SIGCHLD, child_tidptr=0x7fc6ded9fe50) = 32500
```

可以清晰的看到，其中主要是打开 /dev/fuse ，然后通过其文件描述符来调用 mount 函数，最终再通过 clone 实现 daemon 化。之后就是 FUSE 内核与应用程序之间的交互了。

## fuse 协议

既然是客户端-服务器协议，那么与 http 协议一样，每一个从内核到用户空间的请求也都有一个请求头 `fuse_in_header`，它的大小是固定的，定义如下：
```c
struct fuse_in_header {
	uint32_t	len; /* 数据长度：包括 header 在内 */
	uint32_t	opcode; /* 操作码*/
	uint64_t	unique; /* 唯一请求 id */
	uint64_t	nodeid; /* 被操作的文件系统对象（文件或目录）的 ID */
	uint32_t	uid; /* 请求进程的 uid */
	uint32_t	gid; /* 请求进程的 gid */
	uint32_t	pid; /* 请求进程的 pid */
	uint32_t	padding;
};
```

这在 [内核的 fuse.h](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/include/uapi/linux/fuse.h) 头文件和 [libfuse 下的 fuse_kernel.h](https://github.com/libfuse/libfuse/blob/master/include/fuse_kernel.h)中都有定义。

接着在请求头之后，则紧跟着请求体，请求体的长度是可变的，它的具体类型可以通过 `opcode` 来进行判断，它表示了操作的类型，主要就凭借它来识别内核到底想要干嘛，你应该回复什么消息，所有的 opcode 在 libfuse 中均有 [定义](https://github.com/libfuse/libfuse/blob/fuse-3.10.5/include/fuse_kernel.h#L379-L428)。

例如，如果 opcode 为 15 (`FUSE_READ`)，则后面紧跟着 `fuse_read_in` 结构体。不过为了更详细的讲解，我们拿一个更全面的 rename 操作来说明。rename 的 buf 结构长这样 `{fuse_in_header}{fuse_rename_in}{oldname}{newname}`。它的解析过程略有意思:

1. 读取 header，直接读取 `fuse_in_header`，类似这样： `struct fuse_in_header *in = (struct fuse_in_header *) buf;`
2. 判断 opcode 为 15，接下来读取 `fuse_rename_in` 类似这样： `buf += sizeof(struct fuse_in_header);struct fuse_rename_in *arg = (struct fuse_read_in *) buf;`
3. 除此之外，它的结构还跟着 oldname 和 newname，分别这样读取 `char* oldname = (((char*)buf) + sizeof(*buf));char* newname = oldname + strlen(oldname) + 1;`

通过以上步骤，我们就完成了数据的读取，很多的 opcode 都有自己独特的读取方式，这个还是要根据 [fuse.4](https://man7.org/linux/man-pages/man4/fuse.4.html) 文档中的来，我这里只做了一点示例。

读取完请求之后，我们就需要做相应的处理然后写入请求了。如果我们只是简单的代理文件夹，那么可以就可以直接调用系统的 rename 函数了，因此，这里的处理函数就只需要这样就可以：

```c
#include <fcntl.h>
#include <stdio.h>

void handle(void *buf) {
  struct fuse_in_header *in = (struct fuse_in_header *) buf;
  if in.opcode == 15 {
    buf += sizeof(struct fuse_in_header);
	  struct fuse_rename_in *arg = (struct fuse_rename_in *) buf;
    char* oldname = (((char*)buf) + sizeof(*buf));
    char* newname = oldname + strlen(oldname) + 1;
    //这一句才是实际处理，而 renameat 又调回了内核,因此你仍然无法接触任何内核的东西。但是你可以实现你自己的其他逻辑。
    //当然实际情况一般都是代理其他文件夹，所以这里不可能这么写，只是做一个示例。
    renameat(req, fuse_in_header->nodeid, oldname, arg->newdir, newname, 0);
  }
}

```

这样就实现一个基本的改名函数，当然了，上面实现了请求消息解析，但是还缺少写入响应，所以内核还并不知道你处理的结果是怎样的。

fuse 协议的响应头叫 `fuse_out_header` ，长这样：

```c
struct fuse_out_header {
	uint32_t	len;
	int32_t		error;
	uint64_t	unique;
};
```

它包含一个错误码和一个跟请求保持一致的唯一 id，用于标识是哪个请求的响应。接着在之后紧跟着响应体（如果有）。如果错误码不为 0，则不应该包含响应体。具体怎么写其实和req 的读取类似，就不再赘述了。

## libfuse 性能优化

FUSE 相对于内核态的文件系统，效率损耗大概在 `10% - 20%`。但是如果相关代码写得不好，那么性能的损耗可能会非常大。因此如何编写一个好的 FUSE 代码非常重要。这里将从几个最关键的点出发。

### 1. 使用 low level api

`high_level_api` 虽然对于用户来说编写代码非常的方便，但是它的性能损耗是非常大的。

我们以官方示例为例，`example/passthrough_fh.c` 是使用 `high_level_api` 实现的直接文件夹代理，`example.passthrough_hp.cc` 是使用 `low_level_api` 实现的直接文件夹代理。同时，为了模拟常用情况，我们以 nodejs 安装 `node_modules` 为例，请注意，为了去除网络影响，我已经提前使用 `npm install` 在其他文件夹下安装过，这样会利用本地 cache。他们最终安装耗时如下：

* 内核文件系统： 1m9s
* `low_level_api`：1m20s
* `high_level_api`：2m9s

可以看到使用 `low_level_api` 在小文件大量写入的情况下表现与内核态的文件系统已经极为接近了，而使用 `high_level_api` 实现的性能损耗几乎达到 50% 之多。

### 2. 充分缓存数据

如果你认为 `low_level_api` 确实比较难，还是可以利用一些参数来让 `high_level_api` 具有更高性能的。这方面我们需要针对业务场景来做，首先需要了解可以利用的缓存参数：

* `-o kernel_cache`：开启内核文件缓存。
* `-o entry_timeout=T`：文件名缓存时长。
* `-o attr_timeout=T`：属性缓存时长。
* `-o negative_timeout=T`：被删除的文件名缓存时长。
* `-o noforget`: 缓存不失效（这里要注意内存用量）。

其中对于性能影响最大的是前三个，可以根据需要选择是否开启。

而如果使用 `low_level_api` 这些参数的用处就不大了，我们应该在代码中根据情况建立合适的缓存，内核对每一个文件/文件夹都有一个引用计数，我们建立的缓存可以与之对应。比较合适的时机是：

* `lookup`：当要操作某个文件时会先调用 lookup 。内核中的文件引用 +1，用户态建立该文件缓存。
* `readdirplus`: 读取文件夹时调用，内核中的文件引用 +1，用户态建立该文件夹所有文件的缓存。
* `create`：创建并打开文件，内核文件引用 +1，用户态建议该文件缓存。
* `mkdir`：创建文件夹，内核文件引用 +1，用户态建议该文件夹缓存。
* `mknod`: 创建文件，内核文件引用 +1，用户态建议该文件缓存。
* `symlink`: 建立链接，内核文件引用 +1，用户态建议该文件缓存。
* `forget`： 当文件/文件夹关闭时调用，清除文件/文件夹缓存，从而控制内存用量。
* `forgetmulti`： 当多个文件/文件夹关闭时调用，清除多个文件/文件夹的缓存，从而控制内存用量。

你可以在 `example/passthrough_hp.cc` 中看到相关代码：

```cpp
static void sfs_lookup(fuse_req_t req, fuse_ino_t parent, const char *name) {
    fuse_entry_param e {};
    auto err = do_lookup(parent, name, &e);
    if (err == ENOENT) {
        e.attr_timeout = fs.timeout;
        e.entry_timeout = fs.timeout;
        e.ino = e.attr.st_ino = 0;
        fuse_reply_entry(req, &e);
    } else if (err) {
        if (err == ENFILE || err == EMFILE)
            cerr << "ERROR: Reached maximum number of file descriptors." << endl;
        fuse_reply_err(req, err);
    } else {
        fuse_reply_entry(req, &e);
    }
}

static void sfs_forget(fuse_req_t req, fuse_ino_t ino, uint64_t nlookup) {
    forget_one(ino, nlookup);
    fuse_reply_none(req);
}

```

这里仅例举两个函数，其它函数基本类似，就不多赘述。

### 3. 使用零拷贝写入

实现 `write_buf` 而不是 `write` 将得到极大的性能提升。它接收一个 `in_buf` ，然后通过调用 `FUSE_BUFVEC_INIT` 宏生成一个 outbuf 并使用 `fuse_buf_copy` 方法调用写入。这个过程将基本不会产生任何性能的损耗。示例如下：

```cpp

static void do_write_buf(fuse_req_t req, size_t size, off_t off,
                         fuse_bufvec *in_buf, fuse_file_info *fi) {
    fuse_bufvec out_buf = FUSE_BUFVEC_INIT(size);
    out_buf.buf[0].flags = static_cast<fuse_buf_flags>(
        FUSE_BUF_IS_FD | FUSE_BUF_FD_SEEK);
    out_buf.buf[0].fd = fi->fh;
    out_buf.buf[0].pos = off;

    auto res = fuse_buf_copy(&out_buf, in_buf, FUSE_BUF_COPY_FLAGS);
    if (res < 0)
        fuse_reply_err(req, -res);
    else
        fuse_reply_write(req, (size_t)res);
}


static void sfs_write_buf(fuse_req_t req, fuse_ino_t ino, fuse_bufvec *in_buf,
                          off_t off, fuse_file_info *fi) {
    (void) ino;
    auto size {fuse_buf_size(in_buf)};
    do_write_buf(req, size, off, in_buf, fi);
}
```

## 最后

即使你不是使用 C 语言，仍然可以参考 libfuse 自行实现，不过 `GitHub` 中已经有很多开源开发者做了，他们或是自行实现或是封装 libfuse。我这里列举自己比较关心的 `Go` 和 `Rust` 语言的相关库：

* go 语言: [go-fuse](https://github.com/hanwen/go-fuse) 
* rust 语言的 [fuse-rs](https://github.com/zargony/fuse-rs)，不过已经有一段时间没更新了，更推荐 [fuser](https://github.com/cberner/fuser) 这个库，它是 fuse-rs 的一个 fork ，目前在持续更新中。

FUSE 是云原生与容器化的一个重要模块，它几乎是实现 rootless 文件系统的唯一选择，由此发展了 fuse-overlayfs 帮助容器实现 rootless 模式 。而对于我们普通开发者而言，我们也可以通过用户态文件系统来扩展自己想要的功能。
