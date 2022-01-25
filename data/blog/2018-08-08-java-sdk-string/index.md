---
title: 深入理解java String源码
tags:
  - java
  - sdk
  - learning
createdDate: '2018-08-08'
updatedDate: '2018-08-08'
draft: false
origin: true
---

> 以下代码或分析来源于 jdk8

# 简介

String 类由 final 标记，实现了`java.io.Serializable`,`Comparable<String>`,`CharSequence`(字符序列)三个接口。

String/StringBuilder/StringBuffer 本质上都是通过字符数组实现的。

String 是字符串**常量**,对 String 值的操作是产生新的 String 对象。

StringBuilder/StringBuffer 都是字符串**变量**,即可变的字符序列，都继承自 AbstractStringBuilder，实现 CharSequence 接口。对 StringBuffer/StringBuilder 类操作是对字符数组进行扩容。

StringBuffer 是线程安全的，StringBuilder 是非线程安全的。

# 源码浅析

String 类包含`char[] value`属性，StringBuffer/StringBuilder 的父类`AbstractStringBuilder`包含`char[] value`属性。同时注意此 value 在 String 中的声明为`private final char value[]`,对于字符串的处理都是在处理 value 属性。

> String 类做如此多的限定是一种 Immutable 设计模式的典型应用，String 变量一旦初始化后就不能更改，禁止改变对象的状态，从而增加共享对象的坚固性、减少对象访问的错误，同时还避免了在多线程共享时进行同步的需要。

> 另外一点对与 String 类如此设计的猜测，设计到 java 对于 String 类型本身的设计，字符串都存储在常量池中用于共享从而提高性能的，但是如果 String 值是可变的，那么就可能引起冲突，所以需要设计成不可变的，以此来避免字符串共享所引起的数据冲突。

String 类中所有修改值的方法都是返回新的对象，例如 String.substring 方法：

```java
//截取字符串
public String substring(int beginIndex, int endIndex) {
  ...
    int subLen = endIndex - beginIndex;
  ...
    return ((beginIndex == 0) && (endIndex == value.length)) ? this
    : new String(value, beginIndex, subLen);
}

```

处理 value 返回新的字符串对象，new String(value,beginIndex,subLen)构造函数会截取数组并复制给新 String 对象的 value。

但是我们是否能够通过反射来修改呢？做一个尝试：

```java
String s1 = "abcd";
String s2 = "abcd";
String s3 = new String("abcd");
String s4 = new String(s1);
System.out.println("s1==s2:" + (s1 == s2));
System.out.println("s1==s3:" + (s1 == s3));
System.out.println("s3==s4:" + (s3 == s4));
Field field = String.class.getDeclaredField("value");
field.setAccessible(true);
char[] value = (char[]) field.get(s1);
value[1] = 'p';
System.out.println("s1 = " + s1);
System.out.println("s2 = " + s2);
System.out.println("s3 = " + s3);
System.out.println("s4 = " + s4);

System.out.println("s1==s2:" + (s1 == s2));
System.out.println("s1==s3:" + (s1 == s3));
System.out.println("s3==s4:" + (s3 == s4));
```

输出如下：

```
s1==s2:true
s1==s3:false
s3==s4:false
s1 = apcd
s2 = apcd
s3 = apcd
s4 = apcd
s1==s2:true
s1==s3:false
s3==s4:false
```

由此可以看出，反射能够修改 String 的值，但是另外出现了一个有趣的点，在修改了 s1 的值之后，s2/s3/s4 的值都经过了修改。一个一个的看，先看最简单的 s4。

通过 s1 来 new 一个新的 String 对象，翻看构造器源码：

```java
public String(String original) {
  this.value = original.value;
  this.hash = original.hash;
}
```

很简单，是通过传递引用 value 来构造的新的 String 对象，也就是说 s1 和 s4 享有同一个 char 数组。所以无论我们修改 s1 还是 s4 的值，都是修改的这个 char 数组。所以 s4 随着 s1 变化，可以理解。

接下来看 s2/s3 为什么变化：

表面上看，s1 与 s2 的赋值虽然都是“相等”的字符串，但是无论声明还是使用看起来都确实是分开的。这里从 jdk 源码上我们无从得知具体原因。这牵扯出了我们对于 String 类型的最大疑问，字符串的本质到底是怎样的，jvm 是如何对待一特殊的类型的。探究出 s2 自然而然就能了解 s3 变化的始末。

# String 的本质

其实从前面的源码查看中，我们已经能够看出来，字符串的本质就是**字符数组**。但是按照不同的方式来初始化出来的字符串却并不是被一视同仁的。

String 的定义方法归纳出来大致分为三种方式：

- 双引号直接赋值：`String str = "str"`;
- 使用 new 关键字：`String str = new String("str")`;
- 连接字符串：`String str = "s" + "tr"`;

在此，需要先了解一下 jvm 中的堆栈、常量池的概念。

## 常量池

常量池指的是在编译期就被确定，并且保存在已编译的.class 文件中的一些数据，包含代码中所定义的各种基本类型（如 int、long 等等）和对象型（如 String 及数组）的常量值(final)还包含一些以文本形式出现的符号引用。比如：

- 类和接口的全限定名
- 字段的名称和描述符
- 方法的名称和描述符

## 堆

一个运行时的数据区域，类的对象就是在这里分配空间的。这些对象通过 new、newarray、 anewarray 和 multianewarray 等指令建立，它们不需要程序代码来显式的释放。堆是由垃圾回收来负责的，堆的优势是可以动态地分配内存 大小，生存期也不必事先告诉编译器，因为它是在运行时动态分配内存的，Java 的垃圾收集器会自动收走这些不再使用的数据,也因此大小和声明周期并不确定。但缺点是，由于要在运行时动态 分配内存，存取速度较慢。堆中的对象不可以共享（注意，这里的共享不是指我们在 java 代码中的赋值给另外一个引用，而是指:`Object a = new Object();Object b = new Object()`则`a == b`的情况）

## 栈

存取速度比堆要快，仅次于寄存器，栈数据可以共享(`int a = 1;int b = 1`则`a == b`)，存放基本类型的变量数据和对象的引用，但对象本身不存放在栈中，而是存放在堆（new 出来的对象）

> ps:网上有说对象不一定存储在堆中，这句话是对的，但是举出来的反例是字符串对象存储在常量池中，这个反例是错误的，大胆举证一个最简单的例子，`String a = new String("a");String b = new String("a")`，如果按照这种说法，那么`a == b`，因为常量池中的数据是共享的，然后明显不对，至于更深层次的原因下面讲到。正确的反例应当是《深入理解 java 虚拟机 》一书中所说到的 “随着 JIT 编译期的发展与逃逸分析技术逐渐成熟，栈上分配、标量替换优化技术将会导致一些微妙的变化，所有的对象都分配到堆上也渐渐变得不那么“绝对”了”。通熟点就是 java 底层优化越来越变态导致的。

## 解析 String 的定义

在编译期就被确定的（以双引号定义的）字符串就被存储在常量池中，如果运行期（new）才能确定的就存储在堆中。

这里了解以下 String.intern 方法。String 的 intern()方法会查找在常量池中是否存在一份 equal 相等的字符串,如果有则返回该字符串的引用,如果没有则添加自己的字符串进入常量池。

> 运行时常量池相对于 CLass 文件常量池的另外一个重要特征是具备动态性，Java 语言并不要求常量一定只有编译期才能产生，也就是并非预置入 CLass 文件中常量池的内容才能进入方法区运行时常量池，运行期间也可能将新的常量放入池中，这种特性被开发人员利用比较多的就是 String 类的 intern()方法。

- 第一种定义方法执行过程(`String str = "str"`)：在程序编译期间，编译程序先去字符串常量池检查，是否由"str"存在，如果不存在，则在常量池中开辟一个内存空间存放"str"，如果存在，则不开辟。接着，会在堆中创建一个 String 对象，注意这里和网上有些说法不一样，下面我们通过代码证明这里的正确性，之后在栈中开辟一块空间，命名为 str，存放对象的**地址**。

```java
String s = new String("str");
        String s2 = s.intern();
        System.out.println(s == s2);

-------输出---------------
false
```

明显看出 s2 并不是指向的 s，而是指向的"str"字符串所指向的对象。

- 第二种定义方法执行过程(String str = new String("str")):在程序编译期间，编译程序先在字符串常量池检查，是否存在"str"，如果不存在，则在常量池中开辟一个内存空间存放"str"。如果不存在，则开辟一个内存空间，否则不开辟。然后在内存堆中开辟一个空间，存放 new 出来的 String 实例，之后在栈中开辟一个空间，命名为 str,存放堆中 String 实例的内存 **地址** ，这个过程就是将引用 str 指向 new 出来的 Sring 实例。

* 第三种定义方法执行过程:对于第三个方法的过程会稍显复杂，在这个举例中 jvm 会进行小技巧优化。我们将定义的形式变化一下，绕过这个优化，然后根据字节码来判断，当我们进行字符串拼接初始化字符串时会发生什么。

原代码如下：

```
String s = "1"+"2"+"3";
System.out.println(s);
String s2 = "2";
for (int i = 0; i < 10; i++){
  s2 += s2;
}
System.out.println(s2);
```

字节码输出如下：

```
Code:
0: ldc           #2                  // String 123
2: astore_1
3: getstatic     #3                  // Field java/lang/System.out:Ljava/io/PrintStream;
6: aload_1
7: invokevirtual #4                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V
10: ldc           #5                  // String 2
12: astore_2
13: iconst_0
14: istore_3
15: iload_3
16: bipush        10
18: if_icmpge     46
21: new           #6                  // class java/lang/StringBuilder
24: dup
25: invokespecial #7                  // Method java/lang/StringBuilder."<init>":()V
28: aload_2
29: invokevirtual #8                  // Method java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
32: aload_2
33: invokevirtual #8                  // Method java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
36: invokevirtual #9                  // Method java/lang/StringBuilder.toString:()Ljava/lang/String;
39: astore_2
40: iinc          3, 1
43: goto          15
46: getstatic     #3                  // Field java/lang/System.out:Ljava/io/PrintStream;
49: aload_2
50: invokevirtual #4                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V
53: return

```

简单描述一下关键：

- `0: ldc #2 // String 123` 代表引用常量池里的值，这里代码经过编译器优化之后，`"1"+"2"+"3"`被优化成了`"123"`

- astore_2 代表将 ldc 的值“2”存到**局部变量表**(用于存放方法参数和方法内部定义的局部变量)中的第 2 个槽中

- 13-43 行是一个循环。也就是我们的 0-10 的循环，可以看到在这个循环中在不停的 new StringBuilder（21 行）。这种没有经过编译器优化的拼接是采用 StringBuidler 实现的。

- 最后会调用 StringBuilder 的 toString 方法，然后 jvm 会拿到字符序列，并按照 String 对象的处理方式进行处理。

简单对比我们主动采用 StringBuider 类拼接字符串。
源码：

```java
StringBuilder s2 = new StringBuilder("2");
for (int i = 0; i < 10; i++){
  s2.append("2");
}
System.out.println(s2);
```

字节码：

```
0: new           #2                  // class java/lang/StringBuilder
3: dup
4: ldc           #3                  // String 2
6: invokespecial #4                  // Method java/lang/StringBuilder."<init>":(Ljava/lang/String;)V
9: astore_1
10: iconst_0
11: istore_2
12: iload_2
13: bipush        10
15: if_icmpge     31
18: aload_1
19: ldc           #3                  // String 2
21: invokevirtual #5                  // Method java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
24: pop
25: iinc          2, 1
28: goto          12

```

明显看到在 0 处 new 了一次 StringBuilder 之后，就一直在重用此对象。显然提高了很多的效率。

回到定义方式继续探讨，三种定义方式都抛出了一个非常重要的问题，new 出来的 String 对象实例和在常量池中的字符串是什么关系？有什么区别？为什么直接定义的字符串同样可以调用 String 对象的各种方法呢？

以”String s1 = new String("somestring")“为例，在字符串常量池中存储"somestring"字符序列，在堆中开辟 String 对象空间，在栈中存储这个地址命名为 s。首先就需要弄清楚，怎么通过对象找到常量池中的字符串？

在解析阶段，虚拟机发现字符串常量 somestring，它会在一个内部字符串常量列表【各种虚拟机实现方式可能不一样，例如 hotspot 使用 hashtable 实现】中查找，如果没有找到，那么会在堆中创建一个包含字符序列[somestring]的 string 对象*s*，然后把这个字符序列和对应的 String 对象做为名值对（[somestring],s）保存到内部字符串常量列表中。

弄懂了这些原理，我们就能够清楚的知道前面 s1/s2/s3/s4 发生变化的原因了，很简单，因为都是操作的同样的一个字符序列，这也是 java 废了很大力气去优化的一点，让所有的想同字符串字面值只存储一次，以实现性能、空间利用的最大提升。

完成以上问题之后，就可以完美解决面试经常遇到的以下问题：

- 得出以下输出

```java
String s1 = "str";
String s2 = "str";
String s3 = new String("str");
String s4 = new String(s1);

System.out.println(s1 == s2);
System.out.println(s1 == s3);
System.out.println(s3 == s4);
System.out.println(s1 == s4);
```

- 每一行代码（(每行代码分开运行，不考虑前置因素)），各自产生了多少个对象，字符串常量池里面有哪几个值。

```java
String s2 = "str";
String s3 = new String("str");
String s5 = new String("str")+"str";
```

# StringBuilder/StringBuffer 源码解析

弄清楚了 String，那么 StringBuilder/StringBuffer 其实已经相当清楚了，本质上讲 StringBuilder/StringBuffer 是对字符数组进行扩容的对象，都继承字 AbstractStringBuilder。查看 AbstractStringBuilder 的源码，发现与 String 一样，包含 char[] value 和 int count。但是与 String 不同的是，它们没有 final 修饰符。因此得出结论：String、StringBuffer 和 StringBuilder 在本质上都是字符数组，不同的是，在进行连接操作时，String 每次返回一个新的 String 实例，而 StringBuffer 和 StringBuilder 的 append 方法直接返回 this，所以这就是为什么在进行大量字符串连接运算时，不推荐使用 String，而推荐 StringBuffer 和 StringBuilder。

## StringBuilder 和 StringBuffer 的源码

查看两个类的 append 和 toString 方法：

```java
//StringBuilder
@Override
public StringBuilder append(String str) {
    super.append(str);
    return this;
}
@Override
public String toString() {
    // Create a copy, don't share the array
    return new String(value, 0, count);
}
//StringBuffer
@Override
public synchronized StringBuffer append(String str) {
    toStringCache = null;
    super.append(str);
    return this;
}
@Override
public synchronized String toString() {
    if (toStringCache == null) {
        toStringCache = Arrays.copyOfRange(value, 0, count);
    }
    return new String(toStringCache, true);
}
```

可以看出第一个区别，StringBuffer 采用 synchronized 修饰，是线程安全的，而 StringBuilder 不是。

另外一点，在 StringBuffer 中有这样一个属性`private transient char[] toStringCache;`。它缓存了字符数组，StringBuffer 下所有的修改方法都会清空掉这个缓存，只有在执行 toString 时才会赋值，而在 StringBuilder 中完全没有这种机制。这是为什么呢？首先要指明的是，其实这个缓存意义不算很大，因为两次 toString 而没有改变的情况是真的少见。但是从设计上来说，这种缓存对于真正遇到这种情况的性能是有提升的，而 StringBuffer 因为线程安全，所以可以设置这样一个缓存，但是 StringBuilder 类并不是线程安全的，如果这样设计会导致可能产生不一致的情况，对照我们平时写的代码来看，缓存应该在同步安全的条件下才被设置以用来提升性能，否则这将导致产生 toString 结果与预期不一致。

所以在使用选择上来说，如果在多线程环境可以使用 StringBuffer 进行字符串连接操作，单线程环境使用 StringBuilder，它的效率更高。

# 答案

true,false,false,false

对象：1,2,3。常量池："str","str",["str","strstr"]

## 参考链接

- [java 内存分配和 String 类型的深度解析](https://www.cnblogs.com/javadevelper/p/6067655.html)

- [java--String 常量池问题的几个例子](https://blog.csdn.net/gaopeng0071/article/details/11741027)

- [java+内存分配及变量存储位置的区别](https://blog.csdn.net/rj042/article/details/6871030)
