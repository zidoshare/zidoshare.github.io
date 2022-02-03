---
title: redis源码解析-字符串
createdDate: "2020-04-06"
updatedDate: "2020-04-06"
tags:
  - redis
  - source
origin: true
draft: false
---


# 摘要

redis中string是最简单Redis类型，本文主要通过查看源代码了解string的实现原理。

# 简单动态字符串

redis没有使用c语言传统的字符串表示，而是自己构建了一种名为简单动态字符串（Simple dynamic string,SDS）的抽象类型，并将SDS自以为Redis的默认字符串实现。

不过redis也并不是完全没有使用c语言标准字符串，实际上c语言标准字符串的设计在用于无需对字符串进行修改的地方更简单高效，例如日志打印。

然而，当Redis需要的不仅仅是一个字符串字面量，而是可以被修改的字符串时，Redis就会使用SDS来表示字符串值，特别是Redis在存储键值对时，底层都会使用SDS实现。

# SDS的定义

sds在sds.h头文件中定义，

在之前的版本中SDS的定义为：

```cpp

struct sdshdr {
  //记录长度
  int len;
  //记录buffer中未使用的字节数量
  int free;
  //字节数组，用于保存字符串
  char buf[];
}

```

然而不知道在什么时候，已经替换为一下代码：

```cpp

typedef char *sds;
struct __attribute__ ((__packed__)) sdshdr5 {
    unsigned char flags; /* 3 lsb of type, and 5 msb of string length */
    char buf[];
};
struct __attribute__ ((__packed__)) sdshdr8 {
    uint8_t len; /* used */
    uint8_t alloc; /* excluding the header and null terminator */
    unsigned char flags; /* 3 lsb of type, 5 unused bits */
    char buf[];
};
struct __attribute__ ((__packed__)) sdshdr16 {
    uint16_t len; /* used */
    uint16_t alloc; /* excluding the header and null terminator */
    unsigned char flags; /* 3 lsb of type, 5 unused bits */
    char buf[];
};
struct __attribute__ ((__packed__)) sdshdr32 {
    uint32_t len; /* used */
    uint32_t alloc; /* excluding the header and null terminator */
    unsigned char flags; /* 3 lsb of type, 5 unused bits */
    char buf[];
};
struct __attribute__ ((__packed__)) sdshdr64 {
    uint64_t len; /* used */
    uint64_t alloc; /* excluding the header and null terminator */
    unsigned char flags; /* 3 lsb of type, 5 unused bits */
    char buf[];
};

```
> 本人喜欢用新不用旧，也就不再去探究原版代码了，而是直接分析新版代码，毕竟对于目前个人而言，业务上并未触碰到如此紧凑到需要真正了解底层实现的地步，所以目前是以学习源码思维为出发点，如果想要看原版代码解析的请谅解。

按照其可保存的长度分为了5种结构体，分别是sdshdr5，sdshdr8，sdshdr16，sdshdr32，sdshdr64。
> sdshdr5在实际代码中并没有被使用。
其中`attribute ((packed))`作用是取消编译阶段的内存优化对齐功能。
题外话：__packed或者__attribute__((packed))关键字的作用就是用来打包数据的时候以1来对齐，比如说用来修饰结构体或者联合体的时候，那么这些成员之间就没有间隙（gaps）了。如果没有加，那么这样结构体或者联合体就会以他的自然对齐方式来对齐。比如某CPU架构的编译器默认对齐方式是4， int的size也是4，char的size是1，那么类似
```cpp
typedef __packed struck test_s
{
char a;
int b;
}test_t;
```
这样定义的结构体的size就是8个字节了。
如果加上packed，size就会变成5个字节，中间是没有gaps的。

这个很重要，redis源码中不是直接对sdshdr某一个类型操作，往往参数都是sds，而sds就是结构体中的buf，在后面的源码分析中，你可能会经常看见s[-1]这种魔法一般的操作，而按照sdshdr内存分布s[-1]就是sdshdr中flags变量，由此可以获取到该sds指向的字符串的类型。

这五个结构体中，len表示字符串的长度，alloc表示buf指针分配空间的大小，flags表示该字符串的类型(sdshdr5，sdshdr8，sdshdr16，sdshdr32，sdshdr64),是由flags的第三位表示的。

源码如下:

```cpp
#define SDS_TYPE_5  0
#define SDS_TYPE_8  1
#define SDS_TYPE_16 2
#define SDS_TYPE_32 3
#define SDS_TYPE_64 4
#define SDS_TYPE_MASK 7
```
可以看出SDS_TYPE只占用了0,1,2,3,4五个数字，正好占用三位，我们就可以使用flags&SDS_TYPE_MASK来获取动态字符串对应的字符串类型

## 通过有两个函数看看字符串原理

接下来的代码中，第一个映入眼帘的函数是：

```cpp
static inline size_t sdslen(const sds s) {
    unsigned char flags = s[-1];
    switch(flags&SDS_TYPE_MASK) {
        case SDS_TYPE_5:
            return SDS_TYPE_5_LEN(flags);
        case SDS_TYPE_8:
            return SDS_HDR(8,s)->len;
        case SDS_TYPE_16:
            return SDS_HDR(16,s)->len;
        case SDS_TYPE_32:
            return SDS_HDR(32,s)->len;
        case SDS_TYPE_64:
            return SDS_HDR(64,s)->len;
    }
    return 0;
}
```

作用是获取sds的长度，我根据结构体定义即可知道，实际上我们只需要获取到`sdshdr`中的`len`即可在`O(1)`的时间复杂度下获取到字符串的长度，而传统意义上的c字符串则需要遍历字节数组，直到找到`\0`（作为高级语言开发者，像本人这种java开发者，很难体会到这种痛苦，(*^_^*)笑）。

但是根据函数定义，我们知道sds类型实际上仅仅只是结构体`sdshdr`中的字节数组，怎么获取到len属性呢？这里就需要用到之前的骚操作了，查看源码会发现函数中，首先使用s[-1]去获取到flags，如果不用内存对齐，因为struct在内存中前后会因为对其空出一截，也就不知道flags坐在地址了，但是取消内存对齐后，即可直接使用s[-1]获取到flags，然后调用`SDS_HDR`宏定义，我们查看`SDS_HDR`宏定义可以发现定义为：

```cpp
#define SDS_HDR(T,s) ((struct sdshdr##T *)((s)-(sizeof(struct sdshdr##T))))
```

其中连接符##用来将两个token连接为一个token，所以当编译器完成替换后为:
```cpp
SDS_HDR(8,s);
//下面是翻译
((struct sdshdr8 *)((s) - (sizeof(struct sdshdr8))))
```
字节数组地址减去struct的size，就能获取到结构体的首地址，然后就能通过`->len`直接访问到len属性，真的很骚的黑科技。

而同理，对于接下来的`sdsavail`函数中的SDS_HDR_VAR
```cpp
//获取sds中的可用空间
static inline size_t sdsavail(const sds s) {
    unsigned char flags = s[-1];
    switch(flags&SDS_TYPE_MASK) {
        case SDS_TYPE_5: {
            return 0;
        }
        case SDS_TYPE_8: {
            SDS_HDR_VAR(8,s);
            return sh->alloc - sh->len;
        }
        case SDS_TYPE_16: {
            SDS_HDR_VAR(16,s);
            return sh->alloc - sh->len;
        }
        case SDS_TYPE_32: {
            SDS_HDR_VAR(32,s);
            return sh->alloc - sh->len;
        }
        case SDS_TYPE_64: {
            SDS_HDR_VAR(64,s);
            return sh->alloc - sh->len;
        }
    }
    return 0;
}
```

其中使用的`SDS_HDR_VAR(T,s)`宏定义
```cpp
#define SDS_HDR_VAR(T,s) struct sdshdr##T *sh = (void*)((s)-(sizeof(struct sdshdr##T)));
```
也被翻译成
```cpp
SDS_HDR_VAR(8,s);
//下面是对应宏定义翻译的产物
struct sdshdr8 *sh = (void*)((s)-(sizeof(struct sdshdr8)));
```

接着就可以直接使用*sh指针访问`alloc`和`len`属性。

从该函数中可以看到获取可用空间是直接使用`alloc`减去`len`，根本没有考虑`\0`但是在实际实现时，还是会在最后加入`\0`，应该还是为了兼容c标准字符串），不使用\0作为结尾有很多好处，可以存储的类型多样性就提高了。

## 内联函数

```cpp
//获取字符串长度
static inline size_t sdslen(const sds s){/**...**/}
//获取字符串可用空间
static inline size_t sdsavail(const sds s){/**...**/}
//设置字符串长度
static inline void sdssetlen(sds s, size_t newlen){/**...**/}
//增加字符串长度
static inline void sdsinclen(sds s, size_t inc) {/**..**/}
//获取字符串已分配空间的大小
static inline size_t sdsalloc(const sds s){/**...**/}
//设置sds已分配空间的大小
static inline void sdssetalloc(sds s, size_t newlen){/**...**/}
```

# 函数定义及实现

```cpp
sds sdscatfmt(sds s, char const *fmt, ...);
sds sdstrim(sds s, const char *cset);
void sdsrange(sds s, ssize_t start, ssize_t end);
void sdsupdatelen(sds s);
void sdsclear(sds s);
int sdscmp(const sds s1, const sds s2);
sds *sdssplitlen(const char *s, ssize_t len, const char *sep, int seplen, int *count);
void sdsfreesplitres(sds *tokens, int count);
void sdstolower(sds s);
void sdstoupper(sds s);
sds sdsfromlonglong(long long value);
sds sdscatrepr(sds s, const char *p, size_t len);
sds *sdssplitargs(const char *line, int *argc);
sds sdsmapchars(sds s, const char *from, const char *to, size_t setlen);
sds sdsjoin(char **argv, int argc, char *sep);
sds sdsjoinsds(sds *argv, int argc, const char *sep, size_t seplen);

sds sdsMakeRoomFor(sds s, size_t addlen);
void sdsIncrLen(sds s, ssize_t incr);
sds sdsRemoveFreeSpace(sds s);
size_t sdsAllocSize(sds s);
void *sdsAllocPtr(sds s);

void *sds_malloc(size_t size);
void *sds_realloc(void *ptr, size_t size);
void sds_free(void *ptr);
```
这当中的大部分函数都很简单，只是对zmalloc文件里面的函数，sds中inline函数，或者是sdsnewlen函数的一层简单调用，就不解释，挑几个重点的看看。

## sds sdsnewlen(const void *init, size_t initlen)


实际使用时，调用sdsnewlen生成新的sdshdr，根据init指针和initlen参数来初始化sds的内容，解读放在代码注释中：
```cpp
sds sdsnewlen(const void *init, size_t initlen) {
    void *sh;
    sds s;
    // 根据initlen获取合适的字符串长度
    char type = sdsReqType(initlen);
    //最低使用SDS_TYPE_8
    if (type == SDS_TYPE_5 && initlen == 0) type = SDS_TYPE_8;
    // 获取对应的结构体长度
    int hdrlen = sdsHdrSize(type);
    unsigned char *fp; /* flags pointer. */

    //// 此处的s_malloc其实就是zmalloc函数,只是一个别名,注意这里，会给sds多增加一个字节的空间，由后面的s[initlen] = '\0';可知，作者是为了兼容C语言的字符串类型，这样就可以直接使用printf来输出sds了，这样非常的方便
    sh = s_malloc(hdrlen+initlen+1);
    if (sh == NULL) return NULL;
    // 如果init == "SDS_NOINIT",那么就会把sds置为未知字符串，如果init == NULL，那么就会把sds置为空字符串
    if (init==SDS_NOINIT)
        init = NULL;
    else if (!init)
        memset(sh, 0, hdrlen+initlen+1);
    s = (char*)sh+hdrlen;
    fp = ((unsigned char*)s)-1;
    // 根据sds类型来初始化sds的内容
    switch(type) {
        case SDS_TYPE_5: {
            *fp = type | (initlen << SDS_TYPE_BITS);
            break;
        }
        case SDS_TYPE_8: {
            SDS_HDR_VAR(8,s);
            sh->len = initlen;
            sh->alloc = initlen;
            *fp = type;
            break;
        }
        case SDS_TYPE_16: {
            SDS_HDR_VAR(16,s);
            sh->len = initlen;
            sh->alloc = initlen;
            *fp = type;
            break;
        }
        case SDS_TYPE_32: {
            SDS_HDR_VAR(32,s);
            sh->len = initlen;
            sh->alloc = initlen;
            *fp = type;
            break;
        }
        case SDS_TYPE_64: {
            SDS_HDR_VAR(64,s);
            sh->len = initlen;
            sh->alloc = initlen;
            *fp = type;
            break;
        }
    }
    // 在初始化完成后，将init的内容拷贝进sds对象中，但是init如果原来等于SDS_NOINIT，就会被置为NULL，所以sds还是一串未知的字符串
    if (initlen && init)
        memcpy(s, init, initlen);
    s[initlen] = '\0';
    return s;
}
```

在动态字符串的所有操作中，大部分会进行对内存的扩大和释放，所以得介绍一下sds中对内存扩大和释放的函数

## sds sdsMakeRoomFor(sds s, size_t addlen)

```cpp
sds sdsMakeRoomFor(sds s, size_t addlen) {
    void *sh, *newsh;
    size_t avail = sdsavail(s);
    size_t len, newlen;
    char type, oldtype = s[-1] & SDS_TYPE_MASK;
    int hdrlen;

    //如果当前available空间的大小大于addlen的大小，那么便不作修改
    if (avail >= addlen) return s;

    len = sdslen(s);
    sh = (char*)s-sdsHdrSize(oldtype);
    newlen = (len+addlen);
    // 在newlen小于SDS_MAX_PREALLOC(1M)，对newlen进行翻倍
    // 否则让newlen加上SDS_MAX_PREALLOC。
    if (newlen < SDS_MAX_PREALLOC)
        newlen *= 2;
    else
        newlen += SDS_MAX_PREALLOC;

    type = sdsReqType(newlen);

    /* Don't use type 5: the user is appending to the string and type 5 is
     * not able to remember empty space, so sdsMakeRoomFor() must be called
     * at every appending operation. */
    if (type == SDS_TYPE_5) type = SDS_TYPE_8;

    hdrlen = sdsHdrSize(type);
    //如果长度能够容纳则只需要申请当前内存加上长度即可
    if (oldtype==type) {
        newsh = s_realloc(sh, hdrlen+newlen+1);
        if (newsh == NULL) return NULL;
        s = (char*)newsh+hdrlen;
    } else {
        //否则重新申请内存，并拷贝内容
        newsh = s_malloc(hdrlen+newlen+1);
        if (newsh == NULL) return NULL;
        memcpy((char*)newsh+hdrlen, s, len+1);
        s_free(sh);
        s = (char*)newsh+hdrlen;
        s[-1] = type;
        sdssetlen(s, len);
    }
    sdssetalloc(s, newlen);
    return s;
}

```

## sds sdsRemoveFreeSpace(sds s)

```cpp
sds sdsRemoveFreeSpace(sds s) {
    void *sh, *newsh;
    char type, oldtype = s[-1] & SDS_TYPE_MASK;
    int hdrlen, oldhdrlen = sdsHdrSize(oldtype);
    size_t len = sdslen(s);
    size_t avail = sdsavail(s);
    sh = (char*)s-oldhdrlen;

    /* Return ASAP if there is no space left. */
    if (avail == 0) return s;

    /* Check what would be the minimum SDS header that is just good enough to
     * fit this string. */
    type = sdsReqType(len);
    hdrlen = sdsHdrSize(type);

    //如果没有达到更小的字节长度则只需要重新分配内存，释放掉多余的内存
    if (oldtype==type || type > SDS_TYPE_8) {
        newsh = s_realloc(sh, oldhdrlen+len+1);
        if (newsh == NULL) return NULL;
        s = (char*)newsh+oldhdrlen;
    } else {
        //否则修改type，复制内容
        newsh = s_malloc(hdrlen+len+1);
        if (newsh == NULL) return NULL;
        memcpy((char*)newsh+hdrlen, s, len+1);
        s_free(sh);
        s = (char*)newsh+hdrlen;
        s[-1] = type;
        sdssetlen(s, len);
    }
    sdssetalloc(s, len);
    return s;
}
```