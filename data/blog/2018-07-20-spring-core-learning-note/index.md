---
title: spring-core文档阅读记录(1)
tags: 
  - java
  - spring
  - learning
createdDate: '2018-07-20'
updatedDate: '2018-07-20'
draft: false
origin: true
image: header.png
---

从头开始学习spring，首先从官方文档入手，先读一读官方spring文档。下面是一些概要笔记。

版本：5.0.6.RELEASE

# 概览

spring 官方对自己的定位是java ee规范的补充（没什么重要的，但是还是想记一下

spring 从java ee中挑选了一些规范实现 分别为

* Servlet API ([JSR 340](https://jcp.org/en/jsr/detail?id=340))

* WebSocket API ([JSR 356](https://www.jcp.org/en/jsr/detail?id=356))

* Concurrency Utilities ([JSR 236](https://www.jcp.org/en/jsr/detail?id=236))

* JSON Binding API ([JSR 367](https://jcp.org/en/jsr/detail?id=367))

* Bean Validation ([JSR 303](https://jcp.org/en/jsr/detail?id=303))

* JPA ([JSR 338](https://jcp.org/en/jsr/detail?id=338))

* JMS ([JSR 914](https://jcp.org/en/jsr/detail?id=914))

* as well as JTA/JCA setups for transaction coordination, if necessary.

spring 设计主要原则：

* 尽可能提供选择，尽可能推迟决策（注：应该是尽可能把选择交给开发者）

* 尽可能灵活，接受任何观点

* 保持兼容性（真的是感同身受，并且觉得很不可思议，无数次迭代，然而api却很少有变化）

spring框架结构介绍请参阅[spring框架结构简介（源自spring文档）](http://zido.site/2018-08-15-spring-structure/)，因为这里只是文档笔记，所以将一些更加详尽的知识放在了其他的文章里

Spring框架不强迫你使用它里面的一切; 它不是一个全有或全无的解决方案。例如：_使用Struts，Tapestry，JSF或其他UI框架构建的现有前端可以与基于Spring的中间层集成，它允许你使用Spring事务功能。 你只需要使用ApplicationContext连接你的业务逻辑，并使用WebApplicationContext来集成你的web层。_

Spring中的强制性日志依赖性是Jakarta Commons Logging API（JCL）。

## ioc容器

容器实现上，主要包为：`org.springframework.beans` 和 `org.springframework.context`。`Beanfactory`（接口）提供了一种能够管理任何类型对象的高级配置机制，`ApplicationContext`继承自它,添加了aop支持,消息资源处理（用于国际化），事件发布，以及Web应用程序上下文

`ApplicationContext`是`BeanFactory`的子接口。它增加了与`Spring`的`AOP特性`的更容易的集成到一起的实现;消息资源处理（用于国际化），事件发布;和应用程序层特定上下文（如`WebApplicationContext`）以用于Web应用程序。applicationContext的两个常用实现`ClassPathXmlApplicationContext` 和 `FileSystemXmlApplicationContext`。
![classPathXmlApplicationContext继承关系图](http://odp22tnw6.bkt.clouddn.com/blog/ClassPathXmlApplicationContext.png)

`java.beans.Introspector.decapitalize`(which Spring is using here). 通过类路径中的组件扫描，Spring根据上面的规则生成未命名组件的bean名称：基本上，取简单的类名称并将其初始字符转换为小写。 然而，在（异常）特殊情况下，当存在多个字符并且第一和第二字符都是大写字母时，原始形式被保留。 这些是由`java.beans.Introspector.decapitalize`（Spring在这里使用）定义的相同规则
GenericApplicationContext是一种更加灵活的组合context，可以使用类似

xml中强制需要使用class指定类名，当使用__内部类名__. 如果你想为一个`static'嵌套类配置bean定义，你必须使用嵌套类的 binary 名字。例如：`com.demo.One$InnerClass`

当定义一个使用静态工厂方法创建的bean时，除了需要指定 class 属性外，还需要通过 factory-method属性来指定创建 bean 实例的工厂方法。Spring将调用此方法(其可选参数接下来介绍)返回实例对象，就此而言，跟通过普通构造器创建类实例没什么两样。

```java
GenericApplicationContext context = new GenericApplicationContext();
    new XmlBeanDefinitionReader(context).loadBeanDefinitions("config.xml");
    new GroovyBeanDefinitionReader(context).loadBeanDefinitions("Config.groovy");
    context.refresh();

    SecondBean second = context.getBean(SecondBean.class);
    second.send();

    FirstBean first = context.getBean(FirstBean.class);
    first.send();

    context.close();
```

组合多种配置文件到一个容器中。

bean元数据包含：包限定的类名称，bean行为元素（说明bean的行为，包括scope，生命周期回调等），引用的其他bean，为bean配置的属性。

[class](https://docs.spring.io/spring/docs/5.0.6.RELEASE/spring-framework-reference/core.html#beans-factory-class )

[name](https://docs.spring.io/spring/docs/5.0.6.RELEASE/spring-framework-reference/core.html#beans-beanname )

[scope](https://docs.spring.io/spring/docs/5.0.6.RELEASE/spring-framework-reference/core.html#beans-factory-scopes)

[constructor arguments](https://docs.spring.io/spring/docs/5.0.6.RELEASE/spring-framework-reference/core.html#beans-factory-collaborators)

[properties](https://docs.spring.io/spring/docs/5.0.6.RELEASE/spring-framework-reference/core.html#beans-factory-collaborators)

[autowiring mode](https://docs.spring.io/spring/docs/5.0.6.RELEASE/spring-framework-reference/core.html#beans-factory-autowire)

[lazy-initialization mode](https://docs.spring.io/spring/docs/5.0.6.RELEASE/spring-framework-reference/core.html#beans-factory-lazy-init)

[initialization method](https://docs.spring.io/spring/docs/5.0.6.RELEASE/spring-framework-reference/core.html#beans-factory-lifecycle-initializingbean)

[destruction method](https://docs.spring.io/spring/docs/5.0.6.RELEASE/spring-framework-reference/core.html#beans-factory-lifecycle-disposablebean )

通过context.getBeanFactory()获取beanfactory实力，可以在代码中动态输入bean（registerSingleton和registerBeanDefinition方法。这种方式不被推荐，可能导致并发访问出错或容器中状态不一致）

内部类bean的名称必须是嵌套类的二进制名称，例如com.example.Foo$Bar

调用一个singleton类型bean A的某个方法时，需要引用另一个非singleton（prototype）类型的bean B，对于bean A来说，容器只会创建一次，这样就没法在需要的时候每次让容器为bean A提供一个新的的bean B实例。

bean scope

| scope       | 描述                                                                                                                                                                                                                                                                                                                                    |
|:------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| singleton   | 默认的，单例模式                                                                                                                                                                                                                                                                                                                        |
| prototype   | 每一次请求（将其注入到另一个bean中，或者以程序的方式调用容器的getBean()方法）都会产生一个新的bean实例，相当与一个new的操作，对于prototype作用域的bean，有一点非常重要，那就是Spring不能对一个prototype bean的整个生命周期负责，容器在初始化、配置、装饰或者是装配完一个prototype实例后，将它交给客户端，随后就对该prototype实例不闻不问 |
| request     | 每一次HTTP请求都会产生一个新的bean，同时该bean仅在当前HTTP request内有效                                                                                                                                                                                                                                                                |
| session     | 每一次HTTP请求都会产生一个新的bean，同时该bean仅在当前HTTP session内有效                                                                                                                                                                                                                                                                |
| application | 作用于ServletContext的生命周期                                                                                                                                                                                                                                                                                                          |
| websocket   | WebSocket的生命周期                                                                                                                                                                                                                                                                                                                     |

> 在spring3.0之后有一个 SimpleThreadScope 类，线程可用，默认不开启。

InitializingBean 和 DisposableBean 接口，可以于容器生命周期交互，jsr-250提供了@PostConstruct 和 @PreDestroy注解更好用

bean声明周期回调函数:

* `@PostConstruct`注解标记的方法
* `InitializingBean`接口的`afterPropertiesSet()`方法
