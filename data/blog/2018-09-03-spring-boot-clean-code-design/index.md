---
title: 一次spring boot干净结构设计纪录
tags:
  - java
  - spring
  - spring boot
createdDate: '2018-09-03'
updatedDate: '2018-09-03'
draft: false
origin: true
---

# 前言

其实以前对于 java 写出来的代码还是颇有微辞，特别是当写 http 服务的时候，写出来的代码难免有许多重复编写却又不得不写的代码，并且一些代码少了一些 spring 的味道，比如 **结果处理**、**日志纪录** 等，即使说得再明白，每一位同事写出来的都多多少少会偏离，失败和异常的界限很多时候的处理不太符合统一的设计，而且对于返回的数据每一次都要用同意的结果处理类进行相关的处理，封装数据、失败原因、错误码、错误信息等等。当在协作的时候，同事在处理 curd 之余还需要考虑很多其他的事，写出来的代码也相当不 clean。

所以，我希望能够通过定制一些 spring 的组件来做到将与业务无关的东西抽离出来，以更加‘spring’的方式来统一进行处理，努力以更好的设计来给代码带来一个良好的开端，当然其中也难免涉及到一些取舍权衡。

# 目标

- 统一的日志纪录，让每一次可能会导致数据异常的请求（增删改）更加清晰。

- 统一的结果处理，代码只需要在正确的情况下，返回正确的数据即可，不再需要进行任何多余的操作，直接返回数据即可。

- 统一的异常处理，能够自动处理一些通用的异常，例如数据校验、runtimeException 等等，也能处理业务中的异常。根据需要能够返回一些简略的信息和相应的 code 给前端调试，纪录日志，让后端能够进行相应的排错。

- 简单的注解鉴权，并且能够自动注入 request 生命周期用户对象。如果需要用户信息直接注入即可。

# 具体实现

## 统一日志处理

可以通过很多种方式实现，我这里采用 aop 实现：

```java
/**
 * controller统一日志处理
 *
 * @author zido
 */
@Aspect
@Component
public class RestControllerAspect {
    private final Logger logger = LoggerFactory.getLogger(RestControllerAspect.class);

    private ObjectMapper mapper;

    //统一注入的用户对象，后面解释
    private User user;

    public RestControllerAspect(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Autowired
    public RestControllerAspect setUser(User user) {
        this.user = user;
        return this;
    }


    //RestController注解标注的类和方法
    @Around("@within(org.springframework.web.bind.annotation.RestController) || @annotation(org.springframework.web.bind.annotation.RestController)")
    public Object apiLog(ProceedingJoinPoint point) throws Throwable {
        MethodSignature signature = (MethodSignature) point.getSignature();
        Method method = signature.getMethod();

        if (!needToLog(method)) {
            return point.proceed();
        }

        String name = user.getName();
        String methodName = getMethodName(point);
        String params = getParamsJson(point);

        logger.info("Started request -> requester [{}] method [{}] params [{}]", name, methodName, params);
        long start = System.currentTimeMillis();
        Object result = point.proceed();
        logger.info("End request -> requester[{}] method [{}] params [{}] and response is [{}] cost [{}] millis", name, methodName, params, result, System.currentTimeMillis() - start);
        return result;
    }

    //获取请求数据
    private String getParamsJson(ProceedingJoinPoint point) {
        Object[] args = point.getArgs();
        StringBuilder sb = new StringBuilder();
        for (Object arg : args) {
            String str;
            if (arg instanceof HttpServletResponse) {
                str = HttpServletResponse.class.getSimpleName();
            } else if (arg instanceof HttpServletRequest) {
                str = HttpServletRequest.class.getSimpleName();
            } else if (arg instanceof MultipartFile) {
                long size = ((MultipartFile) arg).getSize();
                str = MultipartFile.class.getSimpleName() + " size:" + size;
            } else {
                try {
                    str = mapper.writeValueAsString(arg);
                } catch (JsonProcessingException e) {
                    //这里基本不可能进入
                    logger.error("json process error", e);
                    str = "error object";
                }
            }
            sb.append(str).append(",");
            return sb.deleteCharAt(sb.length() - 1).toString();
        }
        return "";
    }

    //获取方法名
    private String getMethodName(ProceedingJoinPoint point) {
        String methodName = point.getSignature().toShortString();
        String SHORT_METHOD_NAME_SUFFIX = "(..)";
        if (methodName.endsWith(SHORT_METHOD_NAME_SUFFIX)) {
            methodName = methodName.substring(0, methodName.length() - SHORT_METHOD_NAME_SUFFIX.length());
        }
        return methodName;
    }

    /**
     * 排除获取数据的方法，因为不会更改任何信息。
     * 另外还可以通过注解标记是否需要日志
     * <br/>
     * 排除全局异常处理类
     *
     * @param method 方法
     * @return true/false
     */
    private boolean needToLog(Method method) {
        return !method.getName().startsWith("get") && !method.getDeclaringClass().equals(ExceptionAdvice.class);
    }

}
```

## 统一的结果处理

我希望能够不需要开发者再去手动执行类似`new Result().setSuccess(true).setCode(0).setData(...)`的方法。而是直接返回 data。然后由统一的处理来进行结果处理。例如：

```java
public Integer getOne(){
    return 1;
}
```

能够得到正常 application/json 响应头，以及类似如下的响应体

```json
{
  "result": 1,
  "code": 0,
  "success": true
}
```

当有异常时，能够得到类似如下的响应体：

```json
{
  "succuess": false,
  "code": 10000,
  "message": "..."
}
```

理论上来说无论方法如何返回，最终 http 结果都将写入 response.body 里面，也就是说无论什么框架，我们都能找到一个入口通过某种方式去切入，定制属于我们自己的响应体。经查，spring 提供了`ResponseBodyAdvice`接口供我们去定制响应体。在此之前，先看看我们的返回实体类`Result`:

```java
public class Result<T> implements Serializable {

    private static final long serialVersionUID = -3266931205943696705L;
    /**
     * 返回数据
     */
    private T result;
    /**
     * 错误码
     */
    private int code = 0;
    /**
     * 成功/失败标识
     */
    private boolean success = true;
    /**
     * 失败信息：用于前端/api调用者调试接口
     */
    private String message;

    public static <T> Result<T> success(T result) {
        Result<T> response = new Result<>();
        response.result = result;
        return response;
    }

    public static <T> Result<T> success() {
        return new Result<>();
    }

    public static Result error() {
        Result result = new Result<>();
        result.code = ErrorCode.UNKNOWN;
        result.success = false;
        return result;
    }

    public static <T> Result<T> error(int code, String message) {
        Result<T> result = new Result<>();
        result.success = false;
        result.code = code;
        result.message = message;
        return result;
    }

    public static <T> Result<T> error(int code) {
        Result<T> result = new Result<>();
        result.success = false;
        result.code = code;
        return result;
    }

    public T getResult() {
        return result;
    }

    public Result<T> setResult(T result) {
        this.result = result;
        return this;
    }

    public int getCode() {
        return code;
    }

    public Result<T> setCode(int code) {
        this.code = code;
        return this;
    }

    public boolean isSuccess() {
        return success;
    }

    public Result<T> setSuccess(boolean success) {
        this.success = success;
        return this;
    }

    public String getMessage() {
        return message;
    }

    public Result<T> setMessage(String message) {
        this.message = message;
        return this;
    }
}
```

然后通过实现`ResponseAdvice`接口，定制响应体

```java
@RestControllerAdvice
public class GlobalResultHandler implements ResponseBodyAdvice {
    private static Logger LOGGER = LoggerFactory.getLogger(GlobalResultHandler.class);

    @Override
    public boolean supports(MethodParameter returnType, Class converterType) {
        return returnType.getMethod().getReturnType() != Result.class;
    }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType, Class selectedConverterType, ServerHttpRequest request, ServerHttpResponse response) {
        if (body instanceof Result || body instanceof String) {
            return body;
        }
        return Result.success(body);
    }

}
```

注意，在 beforeBodyWrite 方法中，我们会判断是否是 String 类。

在此需要稍微的了解一下 spring 对于响应体的处理，它抽象了一个`HttpMessageConverter`接口，能够对响应体进行各种处理，spring 内置了 9 个转换类，分别是：

- ByteArrayHttpMessageConverter (添加 octet-stream 响应头)
- StringHttpMessageConverter (能读取所有请求，并添加 text/plain 响应头 UTF-8 编码)
- StringHttpMessageConverter (能读取所有请求，text/plain 响应头 ISO-8859-1 编码)
- ResourceHttpMessageConverter (octet-stream 响应头)
- SourceHttpMessageConverter (application/xml text/xml)
- AllEncompassingFormHttpMessageConverter (表单处理相关的)
- MappingJackson2HttpMessageConverter (读取响应 json 相关数据)
- MappingJackson2HttpMessageConverter (同上，暂时不知道什么区别)
- Jaxb2RootElementHttpMessageConverterJaxb2RootElementHttpMessageConverter (使用 JAXB2 处理 xml 消息)

他们组成一个消息处理链，顺序匹配。知道遇到一个能处理此返回值的转换类。按照我们正常的 json 请求响应流程来说的话，会默认调用`MappingJackson2HttpMessageConverter`来进行相关的处理。但是有一个例外，就是在 controller 方法中返回的是字符串，spring 会调用`StringHttpMessageConverter`类进行处理。这个转换类只接收 String 类型。如果我们返回了 Result 类，就会报类型转换异常。在此有两种解决方案，第一种是判断返回值，如果是 String 类型，则使用`jackson`/`fastjson`等进行 json 序列化转换成字符串。类似以下代码：

```java
//实例化或者诸如ObjectMapper
ObjectMapper mapper = new ObjectMapper();
...
if(body instanceof String){
    try {
        //返回字符串
        return mapper.writeValueAsString(Result.success(body));
    } catch (JsonProcessingException e) {
        e.printStackTrace();
    }
}

```

这种方式的好处是处理相当方便，代码量极少。但是缺点是查看响应头会发现，Content-Type 是'text/plain'，当然绝大部分情况下，这是无所谓的。但是对于我这种强迫症来说，这是不能接受的，所以我采用了第二种方式：**自定义 StringHttpMessageConverter** 来实现我想要的效果。

看起来代码挺多，其实基本上都是直接复制的 StringHttpMessageConverter 的代码（233。

```java

public class StringToResultHttpMessageConverter extends AbstractHttpMessageConverter<String> {
    public static final Charset DEFAULT_CHARSET = Charset.forName("UTF-8");
    private ObjectMapper mapper;

    public StringToResultHttpMessageConverter() {
        this(DEFAULT_CHARSET);
    }

    public StringToResultHttpMessageConverter(Charset charset) {
        //设置application/json;utf-8的响应头
        super(charset, MediaType.APPLICATION_JSON_UTF8, MediaType.ALL);
    }

    @Override
    protected boolean supports(Class<?> clazz) {
        //只支持string返回值
        return String.class == clazz;
    }

    @Override
    protected String readInternal(Class<? extends String> clazz, HttpInputMessage inputMessage) throws IOException, HttpMessageNotReadableException {
        Charset charset = getContentTypeCharset(inputMessage.getHeaders().getContentType());
        return StreamUtils.copyToString(inputMessage.getBody(), charset);
    }

    @Override
    protected void writeInternal(String s, HttpOutputMessage outputMessage) throws IOException, HttpMessageNotWritableException {
        Charset charset = getContentTypeCharset(outputMessage.getHeaders().getContentType());
        //重点只在这一句，把字符串使用Result包装
        StreamUtils.copy(mapper.writeValueAsString(Result.success(s)), charset, outputMessage.getBody());
    }

    private Charset getContentTypeCharset(MediaType contentType) {
        if (contentType != null && contentType.getCharset() != null) {
            return contentType.getCharset();
        } else {
            return getDefaultCharset();
        }
    }

    @Autowired
    public StringToResultHttpMessageConverter setMapper(ObjectMapper mapper) {
        this.mapper = mapper;
        return this;
    }
}
```

然后通过

```java
@Bean
public StringToResultHttpMessageConverter myConverter() {
    return new StringToResultHttpMessageConverter();
}
```

方式注入即可，当然，理论上也可以直接通过 ConfigureWebmvc 直接覆盖掉原来的 StringHttpMessageConverter。但是我这里没有这么做（因为我太菜，不敢改太多的东西 233。这里有一个注意的点，前面已经知道，spring 会顺序遍历这些消息转换类，所有我们应该把自定义的转换类添加到处理链的前面，否则还是会使用默认的 StringHttpmessageConverter 来进行处理。使用@Bean 来标注的话，自动会放在最前面。

## 数据校验+统一异常处理

对于数据校验可以说的其实挺少的，就那么写注解，只是需要注意 controller 的直接参数校验时，@Validate 注解应该加载 controller 类上，例如这样：

```java
@Validated //注解加在这里才会生效
@RestController
public class TestController(){
    @RequestMapping("/test")
    public String hello(@Length(max = 6,min = 2) String name){
        //...do something
    }
}
```

另外还有就是，如果是 controller 直接接收的 entity 实体类，并且在实体类中加入了校验，当在使用 spring-boot-jpa hibernate 增删的时候也会自动进行校验，有时候挺烦的，我们都已经把数据校验好了，这一层是可以绕过的，可以直接在 properties 文件中，添加`spring.jpa.properties.javax.persistence.validation.mode=none`即可。

然后是异常处理，这个网上就相当多了，直接使用 RestControllerAdvice 注解标注即可，我在这里面添加了对于参数校验异常的处理。示例：

```java
@RestControllerAdvice
public class ExceptionAdvice{
    private static final Logger LOGGER = LoggerFactory.getLogger(ExceptionAdvice.class);
    private static final String HANDLE_EXCEPTION_TEMPLATE = "handle {},url:{},caused by:";
    /**
     * dto参数校验异常处理
     *
     * @param e 校验异常
     * @return result
     */
    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    @Override
    public Result handleMethodArgumentNotValidException(MethodArgumentNotValidException e, HttpServletRequest request) {
        return parseBindingResult(e.getBindingResult());
    }
    @ExceptionHandler(value = BindException.class)
    @Override
    protected Result handleBindException(BindException e, HttpServletRequest request) {
        BindingResult bindingResult = e.getBindingResult();
        return parseBindingResult(bindingResult);
    }

    /**
     * parameter参数校验异常处理
     *
     * @param e 校验异常
     * @return result
     */
    @ExceptionHandler(value = ConstraintViolationException.class)
    @Override
    public Result handleConstraintViolationException(ConstraintViolationException e, HttpServletRequest request) {
        Set<ConstraintViolation<?>> constraintViolations = e.getConstraintViolations();
        Iterator<ConstraintViolation<?>> iterator = constraintViolations.iterator();
        if (iterator.hasNext()) {
            ConstraintViolation<?> next = iterator.next();
            Path propertyPath = next.getPropertyPath();
            String name = "unknown";
            for (Path.Node node : propertyPath) {
                name = node.getName();
            }
            String message = "[" + name + "] " + next.getMessage();
            return Result.error(ErrorCode.INVALID_PARAMETERS, message);
        }
        return Result.error(ErrorCode.INVALID_PARAMETERS);
    }

    /**
     * parameter参数校验异常处理
     *
     * @param e 校验异常
     * @return result
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    @Override
    public Result handleConstraintViolationException(HttpMessageNotReadableException e, HttpServletRequest request) {
        return Result.error(ErrorCode.INVALID_PARAMETERS, e.getMessage());
    }

    @ExceptionHandler(RuntimeException.class)
    @Override
    protected Result handleRuntimeException(RuntimeException e, HttpServletRequest request) {
        logWithTemplate("RuntimeException", request, e);
        return Result.error(ErrorCode.UNKNOWN, e.getMessage());
    }

    /**
    * 处理业务异常，所有业务异常都应该实现CommonBusinessException类
    **/
    @ExceptionHandler(CommonBusinessException.class)
    @Override
    protected Result handleBusinessException(CommonBusinessException e, HttpServletRequest request) {
        LOGGER.info(HANDLE_EXCEPTION_TEMPLATE, e.getClass().getSimpleName(), request.getRequestURI(), e.getClass().getSimpleName());
        return Result.error(e.getCode(), e.getMessage());
    }
    private Result parseBindingResult(BindingResult bindingResult) {
        List<FieldError> errors = bindingResult.getFieldErrors();
        if (errors.size() > 0) {
            //仅获取第一个异常
            FieldError next = errors.get(0);
            String name = next.getField();
            String message = next.getDefaultMessage();
            message = "[" + name + "] " + message;
            return Result.error(ErrorCode.INVALID_PARAMETERS, message);
        }
        return Result.error(ErrorCode.INVALID_PARAMETERS);
    }

    private void logWithTemplate(String exceptionName, HttpServletRequest request, Throwable e) {
        LOGGER.info(HANDLE_EXCEPTION_TEMPLATE, exceptionName, request.getRequestURI(), e);
    }
}
```

其中有个业务异常类，非常简单，就是正常的实现自 RuntimeException，只不过这个类必须返回响应的 code。

```java
public abstract class CommonBusinessException extends RuntimeException {

    public CommonBusinessException(String msg) {
        super(msg);
    }

    public abstract int getCode();
}
```

## 简单的注解鉴权

因为目前做的项目挺简单的，所以也就没有使用什么框架来进行权限管理，这里只是自己进行了一些权限校验，应该以后会单独的写一篇关于`spring security`定制的权限处理（因为 spring security 对于现在的前后端分离式开发的流程并不是很友好）。

> 注意，用户相关的注入，觉得不实用可以跳过，其实我也觉得实用性不大，不过比较喜欢折腾，所以聊胜于无嘛。

首先在用户这一块。我们的用户总共就两个角色，并且角色之间属性不大相同。如果分开处理虽然也行，但是感觉代码比较割裂，并且有时候两种用户其实拥有一样的权限，大多数时候呢，我们获取信息也就是获取个 id，name,avatar 之类的，两种用户都有，基于此，为了能够简单好用一点，我抽象了一个 User 接口，仅提供几个比较通用的属性：

```java
public interface User {
    String getName();

    String getMobile();

    Integer getId();

    Integer getVisible();

    Role getRole();

    String getAvatar();
    //角色枚举
    enum Role {
        //学生，企业用户。
        STUDENT, COMPANY, ALL, NONE;
    }
}
```

除了两种角色之外，还提供 ALL/NONE 角色，分别对应的是`具有任意权限的用户`和`匿名用户`，主要用来进行鉴权。

我们的系统里面两种用户是用两个表存储的（其他属性全不一样= =）。所以就让两个实体类分别实现 User 接口即可。

然后使用这个接口进行相关角色信息的简单缓存，我们使用 redis 进行缓存，也使用一个缓存实现类来进行缓存操作。

```java

public class DefaultCachedUser implements User {
    private Role role;
    private String name;
    private String mobile;
    private Integer id;
    private Integer visible;
    private String avatar;

    public DefaultCachedUser() {

    }

    public DefaultCachedUser(User user) {
        if (user instanceof StuUser) {
            role = Role.STUDENT;
        } else {
            role = Role.COMPANY;
        }
        this.role = user.getRole();
        this.name = user.getName();
        this.mobile = user.getMobile();
        this.id = user.getId();
        this.visible = user.getVisible();
        this.avatar = user.getAvatar();
    }


    @Override
    public String getName() {
        return name;
    }

    public DefaultCachedUser setName(String name) {
        this.name = name;
        return this;
    }

    @Override
    public String getMobile() {
        return mobile;
    }

    public DefaultCachedUser setMobile(String mobile) {
        this.mobile = mobile;
        return this;
    }

    @Override
    public Integer getId() {
        return id;
    }

    public DefaultCachedUser setId(Integer id) {
        this.id = id;
        return this;
    }

    @Override
    public Integer getVisible() {
        return visible;
    }

    public DefaultCachedUser setVisible(Integer visible) {
        this.visible = visible;
        return this;
    }

    public Role getRole() {
        return role;
    }

    @Override
    public String getAvatar() {
        return avatar;
    }

    public DefaultCachedUser setAvatar(String avatar) {
        this.avatar = avatar;
        return this;
    }

    public DefaultCachedUser setRole(Role role) {
        this.role = role;
        return this;
    }
}
```

之后就可以随意使用喜欢的方式将这个类缓存下来，然后进行读取即可。在这个时候，我多做了一步。考虑 spring 提供一个 Request 生命周期的 bean 注入，我可以直接将这个 request 生命周期的 bean 注入到 ioc，然后只需要在使用的时候@Autowire 即可。类似这样：

```java
/**
     * 默认一个请求内注入一个用户bean,并且是延迟加载的，只有当需要的时候，才会注入。
     * 此值不可能为null,但是当未登陆时会获得一个匿名用户,如需鉴权需要配合使用{@link NeedLogin}
     * <br/>
     * 如果只需要部分基本信息，尽量使用此bean，而不是具体stuUser和companyUser。因为后两者会继续多一次数据库查询
     * <br/>
     * <p>
     * 所以推荐使用方式为:
     * <code>
     * public void method(@Autowired User user){
     * ...something
     * }
     * </code>
     * </p>
     *
     * @return user
     */
    @Bean
    @RequestScope(proxyMode = ScopedProxyMode.TARGET_CLASS)
    @Primary
    public User user() {
        User currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            //这里还实现了一个匿名用户，也就是未登陆用户，为了是为了减少npe问题的发生，直接使用user.getRole() == User.Role.NONE进行判断即可
            return new DefaultAnonymousUser();
        }
        return currentUser;
    }

    @Bean
    @RequestScope(proxyMode = ScopedProxyMode.TARGET_CLASS)
    public StuUser stuUser(@Autowired User user) {
        Integer id = user.getId();
        if (user.getRole() == User.Role.STUDENT) {
            return stuUserService.getStuById(user.getId());
        }
        return null;
    }

    @Bean
    @RequestScope(proxyMode = ScopedProxyMode.TARGET_CLASS)
    public CompanyUser companyUser(@Autowired User user) {
        Integer id = user.getId();
        if (user.getRole() == User.Role.COMPANY) {
            return companyUserService.getStuById(user.getId());
        }
        return null;
    }

```

注意 RequestScope 必须设置 proxyMode=ScopedProxyMode.TARGET_CLASS 来进行代理。使用了代理之后，就可以随意注入到任何需要使用的类和方法中了，而且最主要是，当不使用类属性时，不会去查询缓存或者数据库，可以说相当方便了。例如：

```java
@Component
public class Test{
    private final User user;

    public Test(User user){
        //不会进行任何查询，只是代理
        this.user = user;
    }

    public Integer getId(){
        //当具体使用属性的时候，才会去执行查询，并且使用user接口时，不会去数据库查询，而是直接去redis缓存取
        return user.getId();
    }
}

```

当然这样做还是有坏处的，注入的类 **一定不能使用 json 去序列化** ,序列化会报错。

其中有一个方法是`userService.getCurrentUser()`。这个类的实现需要注意，获取当前用户，应该是与 Request 进行绑定的，获取当前 request，然后根据业务进行相关参数获取并查询用户，类似这样：

```java
@Service
public class UserService{
    private final HttpServletRequest request;
    public UserService(HttpServletReqeust request){
        this.request = request;
    }

    public User getCurrentUser(){
        String token = request.getParamater("token");
        //...处理token
        return user;
    }
}

```

通过以上实现之后，就可以像上面日志处理那样直接注入用户啦，使用还是相当方便的。

之后就是权限校验，定义了一个校验注解：

```java
@Documented
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface NeedLogin {
    //需要的角色，默认只要登陆就行，不管角色
    User.Role[] value() default User.Role.ALL;
}
```

然后直接使用 aop 实现权限校验：

```java
@Aspect
@Component
public class PermissionAspect {
    //日常的注入用户
    private User user;

    @Autowired
    public PermissionAspect setUser(User user) {
        this.user = user;
        return this;
    }

    @Pointcut("@annotation(methodDescriptor)")
    public void desMethod(NeedLogin methodDescriptor) {

    }

    @Pointcut("@within(classDescriptor)")
    public void desClass(NeedLogin classDescriptor) {

    }

    private Object process(ProceedingJoinPoint point, NeedLogin descriptor) throws Throwable {
        User.Role[] value = descriptor.value();
        if (user.getRole() == User.Role.NONE) {
            throw new LoginExpectedException();
        }
        for (User.Role role : value) {
            if (user.getRole() == role || role == User.Role.ALL) {
                return point.proceed();
            }
        }
        throw new ForbiddenException();
    }

    @Around(value = "desMethod(descriptor)", argNames = "point,descriptor")
    public Object permissionMethodCut(ProceedingJoinPoint point, NeedLogin descriptor) throws Throwable {
        return process(point, descriptor);
    }

    @Around(value = "desClass(descriptor)", argNames = "point,descriptor")
    public Object permissionClassCut(ProceedingJoinPoint point, NeedLogin descriptor) throws Throwable {
        return process(point, descriptor);
    }
}

```

# 写在最后

其实当我写完，我发现其实没做多少事情，或者说做了一些事情，但是对于真正写代码的帮助始终还是有限的，每个人的理解都不一样，我把一切想得很美好，当在实践的时候，却还是不得不一遍又一遍的 review 同事的代码，来保证大家在方向上不会出现太大的差错。但是我自己理解的设计就这样，只能靠积累，一点点的去尝试优化，也通过这样做去一点点的熟悉源码，然后反过来再帮助自己更轻松地搬砖，形成良性循环，毕竟我还是不想一直局限于 curd。我能慢慢成长，这样就够了。
