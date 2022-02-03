---
title: spring框架结构简介（源自spring文档）
tags:
  - java
  - spring
  - learning
createdDate: '2018-08-15'
updatedDate: '2018-08-15'
draft: false
origin: true
---

Spring 框架由大约 20 个功能模块组成。 这些模块分为核心容器，数据访问/集成，Web，AOP（面向方面的编程），仪器，消息传递和测试

![架构设计图](./images/spring-overview.png)

# Spring 框架组件

| GroupId             | ArtifactId               | Description                                                                                                                                           |
| :------------------ | :----------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| org.springframework | spring-aop               | Proxy-based AOP support 基于代理的 AOP 支持                                                                                                           |
| org.springframework | spring-aspects           | AspectJ based aspects 基于 AspectJ 的切面                                                                                                             |
| org.springframework | spring-beans             | Beans support, including Groovy Bean 支持，包括 Groovy                                                                                                |
| org.springframework | spring-context           | Application context runtime, including scheduling and remoting abstractions 应用程序上下文运行时，包括调度和远程抽象                                  |
| org.springframework | spring-context-support   | Support classes for integrating common third-party libraries into a Spring application context 支持将常见的第三方库集成到 Spring 应用程序上下文中的类 |
| org.springframework | spring-core              | Core utilities, used by many other Spring modules 核心应用程序，由许多其他 Spring 模块使用                                                            |
| org.springframework | spring-expression        | Spring Expression Language (SpEL)                                                                                                                     |
| org.springframework | spring-instrument        | Instrumentation agent for JVM bootstrapping JVM 引导的工具代理                                                                                        |
| org.springframework | spring-instrument-tomcat | Instrumentation agent for Tomcat Tomcat 的工具代理                                                                                                    |
| org.springframework | spring-jdbc              | JDBC support package, including DataSource setup and JDBC access support JDBC 支持包，包括 DataSource 设置和 JDBC 访问支持                            |
| org.springframework | spring-jms               | JMS support package, including helper classes to send and receive JMS messages JMS 支持包，包括用于发送和接收 JMS 消息的助手类                        |
| org.springframework | spring-messaging         | Support for messaging architectures and protocols 支持消息架构和协议                                                                                  |
| org.springframework | spring-orm               | Object/Relational Mapping, including JPA and Hibernate support 对象/关系映射，包括 JPA 和 Hibernate 支持                                              |
| org.springframework | spring-oxm               | Object/XML Mapping 对象/ XML 映射                                                                                                                     |
| org.springframework | spring-test              | Support for unit testing and integration testing Spring components 支持单元测试和集成测试的 Spring 组件                                               |
| org.springframework | spring-tx                | Transaction infrastructure, including DAO support and JCA integration 事务基础设施，包括 DAO 支持和集成制定                                           |
| org.springframework | spring-web               | Web support packages, including client and web remoting Web 支持包，包括客户端和 Web 远程处理                                                         |
| org.springframework | spring-webmvc            | REST Web Services and model-view-controller implementation for web applications Web 应用程序的 REST Web 服务和模型 - 视图 - 控制器实现                |
| org.springframework | spring-websocket         | WebSocket and SockJS implementations, including STOMP support WebSocket 和 SockJS 实现，包括 STOMP 支持                                               |

# 核心

核心容器由 spring-core，spring-beans，spring-context，spring-context-support 和 spring-expression（Spring Expression Language）模块组成。

`spring-core`和`spring-beans`模块提供了框架的基本部分，包括 IoC 和依赖注入功能。 BeanFactory 是一个复杂的工厂模式的实现。

`Context（spring-context`）模块建立在`Core`和`Beans`模块提供的实体基础之上

Context 模块从 Beans 模块继承其特性，并增加了对国际化（例如使用资源束），事件传播，资源加载以及通过例如 Servlet 容器的透明创建上下文的支持。
**ApplicationContext 接口是 Context 模块的焦点**

`spring-expression`提供 spel 表达式支持，支持设置和获取属性
值,属性赋值,方法调用,访问数组的内容,集合和索引器,逻辑和算术运算符,命名变
量,以及通过
Spring IoC
容器中的名称检索对象。 它还支持列表投影和选择以及公共列表聚
合。

# aop

`spring aop`模块提供 aop 支持,另外`spring-aspects`模块提供了与 AspectJ
的集成

spring-instrument-tomcat 模块提供类仪器支持和类加载器实现以在某些应用服务器中使用。 spring-instrument-tomcat 模块包含 Spring 的 Tomcat 的工具代理。

Spring Framework 4 包括一个 `spring-messaging`模块 ,它具有来自 `Spring Integration` 项目的关 键抽象,例如 Message,MessageChannel,MessageHandler 和其他,用作基于消息传递的应用序的基础。 该模块还包括一组用于将消息映射到方法的注解,类似于基于 Spring MVC 注解的编程模型。

# 数据访问/集成

数据访问/集成层由`JDBC`,`ORM`,`OXM`,`JMS`和`Transaction`模块组成。

`spring-jdbc`模块提供了一个 JDBC 抽象层，消除了对繁琐的 JDBC 编码和解析数据库供应商特定的错误代码的需要。

`spring-tx`模块支持实现特殊接口的类以及所有 POJO（普通 Java 对象）的编程和声明事务管理。

`spring-orm`模块为流行的对象关系映射 API 提供集成层，包括 JPA 和 Hibernate。使用 spring-orm 模块，您可以使用这些 O / R 映射框架结合 Spring 提供的所有其他功能，例如前面提到的简单声明式事务管理功能。

`spring-oxm`模块提供了一个支持对象/ XML 映射实现的抽象层，例如 JAXB，Castor，JiBX 和 XStream。

`spring-jms`模块（Java 消息服务）包含用于生成和使用消息的功能。从 Spring Framework 4.1 开始，它提供了与 spring-messaging 模块的集成。

# web

Web 层由`spring-web`，`spring-webmvc`和`spring-websocket`模块组成。(注：这里和 4 的文档比少了 spring-webmvc-portlet 模块)

`spring-web`模块提供基本的面向 Web 的集成功能，例如多部分文件上传功能和使用 Servlet 侦听器和面向 Web 的应用程序上下文来初始化 IoC 容器。 它还包含一个 HTTP 客户端和 Web 的相关部分的 Spring 的远程支持。

`spring-webmvc`模块（也称为 Web-Servlet 模块）包含用于 Web 应用程序的 Spring 的模型视图控制器（MVC）和 REST Web 服务实现。 Spring 的 MVC 框架提供了 domain model（领域模型）代码和 Web 表单之间的清晰分离，并且集成了 Spring Framework 所有的其他功能。

# test

`spring-test`模块支持使用`JUnit`或`TestNG`对`Spring`组件进行单元测试和集成测试。 它提供了`SpringApplicationContexts`的一致加载和这些上下文的缓存。 它还提供了[mock objects](http://docs.spring.io/spring/docs/5.0.0.M4/spring-framework-reference/htmlsingle/#mock-objects)(模拟对象)，您可以使用它来单独测试您的代码。

# 参考

注意：**spring 版本为 5.x**

[Spring Framework 5.0.0.M3 中文文档
](https://muyinchen.gitbooks.io/spring-framework-5-0-0-m3/content/22-modules.html),感谢大神的翻译
