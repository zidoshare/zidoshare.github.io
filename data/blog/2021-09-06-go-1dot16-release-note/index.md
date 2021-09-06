---
title: golang 1.16 版本更新（翻译+部分见解）
createdDate: "2021-09-06"
updatedDate: "2021-09-06"
tags:
  - go
origin: true
draft: false
---

# 兼容性

Golang 1.16 相对于 Golang 1.15 版本来说语言上没有任何变化，主要都是 工具链、运行时、库实现上面。因此与之前版本保持兼容。

# 更新特性

## 多平台支持

* 添加ARM 64 位 MacOS 的编译支持，可以使用 GOOS=darwin GOARCH=arm64 的环境变量来编译。
* 添加 `netbsd/arm64`
* 添加 `openbsd/mips64`
* 去除了 `GO386=387`
* `linux/rscv64` 支持 `cgo` 和 `-buildmod=pie`

## 工具

### Go Modules

* 从 1.13 开始 `GO111MODULE` 是 `auto` 的。但是从 1.16 开始，这个环境变量默认为 `on` 。看来是要把 Go Modules 贯彻到底了。其实我觉得 GoPath 用来写小工具也还是很顺畅的。
* `go build` 和 `go test` 指令默认不会再修改 `go.mod` 和 `go.sum` 文件了，如果确实需要更新，默认会报错，比如某些依赖不使用了或者有些模块缺失。可以明确的使用 `go mod tidy` 和 `go get` 来明确修改。行为终于不再那么诡异了。
* `go install` 命令可以接受版本后缀，（例如，`go install exam ple.com/cmd@v1.0.0`），从 1.16 起，推荐使用 `go install`来安装二进制工具。
* `go get` 现在推荐使用 `-d` 指令来安装模块中的依赖项，但是仅会下载源码而不会再编译了。当然不使用 `-d` 指令仍然可以安装工具，但是不推荐，以后可能会默认开启这个 `-d` 选项。按照这种思路来看，以后 `go install` 用来安装二进制工具（主要是编译二进制可执行文件），`go get`（暂时带 `-d`） 指令用来调整安装模块所需要的依赖。
* `go.mod` 支持 `retract` 指令来指示某些版本不可用，比如 添加 `retract 0.3.1` 指令，然后在上面加一些注释，那么其他人拉取这个版本的时候，就会收到 warning。`retract` 大概类似一种**撤回**的解决方案。
* `go mod tidy` 和 `go mod vendor` 添加 `-e` 指令忽略错误。
* `go.mod` 中 `exclude` 指令之前是跳过此版本，现在变更为忽略此依赖
* 在模块模式下，go 命令现在不允许导入包含非 ASCII 字符或带有前导点字符（.）的路径元素。

在 1.13 后，使用 `go get` 安装全局的 go 工具其实会相对来说小心一点，如果你刚好在一个 go mod 下，那么就会更新到 go.mod 下，会很烦恼，一般来说都是通过 `cd $(mktemp -d); GO111MODULE=on go get example.com/cmd@v1.0.0` 来解决。以后就可以直接用 `go install` 啦。

### 嵌入文件

java 在打包的时候可以直接将任何静态文件打到 `jar` 包中，对于外部来看好像不需要任何配置文件一样，但是一直以来， go 不具备这样的能力，我们不得不一边在代码仓库里写一些配置文件，打包的时候，还需要把这些配置文件复制到对应目录下面才行。

现在， `go` 可以通过`//go:embed`指令在编译阶段将静态资源文件打包进编译好的程序中，并提供访问这些文件的能力。

简单使用示例如下：
```go
package main

import (
    _ "embed"
    "fmt"
)

//go:embed version.txt
var version string

func main() {
    fmt.Printf("version %q\n", version)
}
```

### Go test

现在在运行 `go test` 的时候，如果被测试的函数在运行期间调用 `os.Exit(0)` 将被认为是失败。但是 `TestMain` 函数如果调用 `os.Exit(0)` 认定为成功/

> 在写测试时，有时需要在测试之前或之后进行额外的设置（setup）或拆卸（teardown）；有时，测试还需要控制在主线程上运行的代码。为了支持这些需求，testing 包提供了 TestMain 函数`func TestMain(m *testing.M)`

`-c` 和 `-i` 参数可以用来为测试编译和安装包，从 1.16 开始，如果带有这两个标志中的一个，并且携带位置标志的话，那么将会报错。

### Go get

`go get` 的 `-insecure` 标志正式弃用，可以使用 GOINSECURE 环境变量。另外如果要绕过模块验证，可以使用 `GOPRIVATE` 和 `GONOSUMDB`  环境变量。

### GOVCS 环境变量

现在可以通过 GOVCS 环境变量来选择使用哪种版本管理工具， `go help vcs` 可以查看详情

### all 模式 ？？？

`go mod vendor` 命令现在只把主模块中的依赖放进 `vendor` 目录中，以前还会放 `test` 的依赖包

### -toolexec 构建标识

现在可以使用`-toolexec`构建标识以在调用工具链程序（如`go build`或`go asm`）时环境变量`TOOLEXEC_IMPORTPATH`现在被设置为正在构建的软件包的导入路径。

### -i 构建标识

去掉了 `go build`、`go install`和 `go test` 的 `-i` 标识。

### list 命令

当设置 `-export` 时 会输出 `BuildID` 字段。这个字段是 当前go build 的 ID。

### -overlay 标识

-overlay标志指定了一个包含一组文件路径替换的JSON配置文件。覆盖标志可以用于所有构建命令和go mod子命令。它主要用于编辑器工具，如gopls，以了解对源文件未保存的更改的影响。配置文件将实际文件路径映射到替换文件路径，go命令及其构建将在实际文件路径与替换文件路径给出的内容存在的情况下运行，如果替换文件路径为空，则不存在。

## Cgo

现在 `cgo` 工具将不会再尝试把 `c struct` 翻译为 `go struct`，即使他们的内存 `size` 一样。这是因为 c struct 在内存中出现的顺序取决于实现。因此在某些情况下 `cgo` 工具产生的结果是错误的。


## Vet

### 新增一个在 goroutine 中使用 test.T 的警告

```go
func TestFoo(t *testing.T) {
    go func() {
        if condition() {
            t.Fatal("oops") // This exits the inner func instead of TestFoo.
        }
        ...
    }()
}
```

### 新增一个帧指针的警告

amd64汇编在没有保存和恢复BP寄存器（帧指针）的情况下抢占了BP寄存器，这违反了调用惯例。不保留BP寄存器的代码必须被修改为完全不使用BP或者通过保存和恢复来保留BP。保存BP的一个简单方法是将帧大小设置为非零值。参见`CL 248260`(https://golang.org/cl/248260)，了解修复的例子

### 新增一个 asn1.Unmarshal 的警告

[asn1.Unmarshal](https://golang.org/pkg/encoding/asn1/#Unmarshal) 传递一个 空指针 或者一个 nil 的参数会被报警告。这和 `json.Unmarshal` 以及 `xml.Unmarshal` 一致。

## 运行时

新的 [runtime/metrics](https://golang.org/pkg/runtime/metrics/) 包引入了一个稳定的接口，用于从 Go 运行时读取实现定义的度量指标。它取代了现有的函数，如`runtime.ReadMemStats`和`debug.GCStats`，并且明显更通用和高效。更多细节见软件包文档。

将`GODEBUG`环境变量设置为`inittrace=1`现在会使运行时对每个包的init发出一行标准错误，总结其执行时间和内存分配。这种跟踪可以用来寻找Go启动性能的瓶颈或退步。[GODEBUG 文档](https://golang.org/pkg/runtime/#hdr-Environment_Variables)描述了其格式。

在Linux上，运行时现在默认为及时向操作系统释放内存（使用MADV_DONTNEED），而不是在操作系统面临内存压力时懒释放（使用MADV_FREE）。这意味着像RSS这样的进程级内存统计将更准确地反映Go进程所使用的物理内存的数量。目前使用 GODEBUG=madvdontneed=1 来改善内存监控行为的系统不再需要设置这个环境变量。

Go 1.16 修正了`Race`检测器 和 Go 内存模型之间的一个差异。现在，`Race`检测器更精确地遵循内存模型的通道同步规则。因此，检测器现在可以报告以前遗漏的数据竞争。

## 编译器

编译器现在可以内联带有非标记的for循环、方法值和类型开关的函数。内联器还可以检测到更多可以内联的间接调用。

## 链接器

这个版本包括对Go链接器的额外改进，减少了链接器的资源使用（包括时间和内存），并提高了代码的健壮性/可维护性。这些变化构成了[使 Go 链接器现代化](https://golang.org/s/better-linker)的两个版本项目的后半部分。

1.16中的链接器变化将1.15的改进扩展到所有支持的架构/操作系统组合（1.15的性能改进主要集中在基于ELF的操作系统和amd64架构）。对于一组有代表性的大型围棋程序，链接速度比1.15快20-25%，对于linux/amd64来说，需要的内存平均少5-15%，其他架构和操作系统的改进更大。由于更积极的符号修剪，大多数二进制文件也更小。

在Windows上，go build -buildmode=c-shared现在默认会生成Windows ASLR DLLs。ASLR可以用--ldflags=-aslr=false来禁用。

## 核心库

### 嵌入文件

[embed](https://golang.org/pkg/embed/) 包提供了使用 `//go:embed` 指令嵌入文件的功能

### 文件系统

新的[io/fs](https://golang.org/pkg/io/fs/)包定义了[fs.FS](https://golang.org/pkg/io/fs/#FS)接口，这是一个对文件的只读树的抽象。标准库包已经被调整为适当地使用该接口。

在接口的生产者方面，新的embed.FS类型实现了fs.FS，zip.Reader也是如此。新的os.DirFS函数提供了一个由操作系统文件树支持的fs.FS的实现。

在消费者方面，新的 http.FS 函数将 fs.FS 转换为 http.FileSystem。此外，html/template和text/template包的ParseFS函数和方法从fs.FS中读取模板。

对于测试实现fs.FS的代码，新的测试/fstest包提供了一个TestFS函数，用于检查和报告常见的错误。它还提供了一个简单的内存文件系统实现，MapFS，这对测试接受fs.FS实现的代码很有用。

### io/ioutil 包已废弃

之前的 io/ioutil 包被标记废弃，但是还可以使用，不过鼓励迁移

* Discard => io.Discard
* NopCloser => io.NopCloser
* ReadAll => io.ReadAll
* ReadDir => os.ReadDir (note: returns a slice of os.DirEntry rather than a slice of fs.FileInfo)
* ReadFile => os.ReadFile
* TempDir => os.MkdirTemp
* TempFile => os.CreateTemp
* WriteFile => os.WriteFile

### 其他库的小变化

略。无所谓了。。可以看原文:<https://golang.org/doc/go1.16#minor_library_changes>
