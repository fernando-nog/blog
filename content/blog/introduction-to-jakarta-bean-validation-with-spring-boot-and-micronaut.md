---
title: "Introduction to Jakarta Bean Validation: Practical Examples with Spring Boot and Micronaut"
date: "2026-03-20"
description: "Learn how Jakarta Bean Validation works, which constraints matter most, and how to use it effectively in Spring Boot and Micronaut without turning validation into misplaced business logic."
tags:
  [
    "java",
    "jakarta",
    "bean-validation",
    "spring-boot",
    "micronaut",
    "backend-development",
    "validation",
  ]
---

Picture this: you expose a simple REST endpoint to create a user, and within the first day someone sends an empty name, an invalid email, a negative age, and a 4,000-character biography. None of this is surprising. What is surprising is how many Java applications still mix these basic guardrails into controllers, services, random `if` statements, and duplicated utility methods.

Jakarta Bean Validation exists to solve exactly that class of problem. It gives you a standard way to declare constraints close to the data they protect, validate them consistently, and let frameworks such as Spring Boot and Micronaut enforce those rules for you.

## What Jakarta Bean Validation Actually Is

Jakarta Bean Validation is the standard validation API in the Jakarta ecosystem. According to the Jakarta EE tutorial, it provides a facility for validating objects, object members, methods, and constructors.

In practice, that means you can declare rules with annotations such as:

- `@NotNull`
- `@NotBlank`
- `@Size`
- `@Min`
- `@Max`
- `@Email`
- `@Pattern`
- `@Past`
- `@Future`

Instead of scattering validation logic everywhere, you attach constraints to the model or method contract and let a validator check them in a consistent way.

That does not remove all validation code from your application. It removes the repetitive, mechanical part of validation so you can focus on rules that are actually domain-specific.

## Why It Matters

Bean Validation is useful because it improves three things at once:

- readability: the rules are visible where the data is defined
- consistency: the same object can be validated in controllers, services, tests, and persistence workflows
- framework integration: modern Java frameworks can trigger validation automatically

This is especially useful in backend APIs, where you want invalid input rejected early and predictably.

## The Constraints You Will Use Most Often

You do not need to memorize the full list of annotations on day one. Most teams repeatedly use a small subset.

| Constraint                      | Typical use                                         |
| ------------------------------- | --------------------------------------------------- |
| `@NotNull`                      | value must exist                                    |
| `@NotBlank`                     | string must contain non-whitespace text             |
| `@NotEmpty`                     | string, collection, map, or array must not be empty |
| `@Size`                         | string length or collection size bounds             |
| `@Min` / `@Max`                 | numeric bounds                                      |
| `@Positive` / `@PositiveOrZero` | positive numeric values                             |
| `@Email`                        | email-like format                                   |
| `@Pattern`                      | regex-based validation                              |
| `@Past` / `@Future`             | temporal rules                                      |

The distinction between `@NotNull`, `@NotEmpty`, and `@NotBlank` is worth learning early:

- `@NotNull` only rejects `null`
- `@NotEmpty` rejects `null` and empty values
- `@NotBlank` is for strings and also rejects whitespace-only values

That small difference avoids a lot of bad API behavior.

## A Simple Example

Here is the kind of DTO where Bean Validation shines:

```java
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateUserRequest {

    @NotBlank
    @Size(max = 100)
    private String name;

    @Email
    @NotBlank
    private String email;

    @Min(18)
    private int age;

    @Size(max = 500)
    private String bio;

    // getters and setters
}
```

This is already better than repeating the same checks in every controller method. The rules are visible, testable, and reusable.

## `@Valid` vs `@Validated`

This is one of the most common points of confusion.

`@Valid` comes from `jakarta.validation` and is mainly used to trigger cascaded validation of an object. In other words, validate this object and walk into its nested constrained fields too.

`@Validated` is Spring-specific and is commonly used to enable method validation on Spring beans.

A practical mental model:

- use `@Valid` on request bodies, nested objects, and collections of objects
- use `@Validated` on Spring service classes when you want method parameter or return value validation

Spring's own docs are explicit here: `@Valid` by itself is not a constraint annotation. It triggers nested validation, but method validation happens when actual constraint annotations such as `@NotBlank` or `@Min` are declared on parameters or return values.

## Using Jakarta Bean Validation with Spring Boot

In Spring Boot, the usual starting point is adding the validation starter:

```gradle
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-validation")
}
```

Spring Boot uses a Bean Validation provider on the classpath and integrates it with Spring's validation infrastructure.

### Validating a Request Body

```java
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {

    @PostMapping("/users")
    public void createUser(@RequestBody @Valid CreateUserRequest request) {
        // business logic
    }
}
```

In Spring MVC, `@Valid` on `@RequestBody`, `@ModelAttribute`, and `@RequestPart` is the common entry point for object validation. Spring Framework documents that this kind of validation raises `MethodArgumentNotValidException` when validation applies to a single command object.

### Validating Service Methods

```java
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

@Service
@Validated
public class UserService {

    public void changePassword(
        @NotBlank String userId,
        @Size(min = 12, max = 128) String newPassword
    ) {
        // business logic
    }
}
```

Spring Boot documents that method validation is automatically enabled when a Bean Validation implementation is present, and classes whose methods should be checked need `@Validated`.

### One Important Spring MVC Nuance

Current Spring Framework documentation also calls out an easy mistake: if you put class-level `@Validated` on a controller, validation may go through an AOP proxy instead of using Spring MVC's newer built-in method validation support. For Spring MVC controllers, that is often unnecessary now.

Practical rule:

- controllers: prefer `@Valid` on request objects and direct parameter constraints when appropriate
- services: use `@Validated` for method validation

### Custom Messages

Spring Boot also integrates Bean Validation messages with the application's `MessageSource`, which means messages can be resolved from `messages.properties`.

Example:

```java
@NotBlank(message = "{user.name.required}")
private String name;
```

Then in `messages.properties`:

```properties
user.name.required=Name is required
```

## Using Jakarta Bean Validation with Micronaut

Micronaut takes a different approach. Its validation module is designed around compile-time metadata rather than heavy runtime reflection.

To enable it, Micronaut's docs show these dependencies:

```gradle
dependencies {
    annotationProcessor("io.micronaut.validation:micronaut-validation-processor")
    implementation("io.micronaut.validation:micronaut-validation")
}
```

For request or DTO-style classes, Micronaut commonly relies on introspection metadata. In practice, that usually means annotating the class with `@Introspected`:

```java
import io.micronaut.core.annotation.Introspected;

@Introspected
public class CreateUserRequest {
    // fields, constraints, getters, setters
}
```

### Validating Bean Methods

Micronaut validates methods on beans when you annotate parameters with Jakarta validation constraints.

```java
import jakarta.inject.Singleton;
import jakarta.validation.constraints.NotBlank;

@Singleton
public class UserService {

    public void greet(@NotBlank String name) {
        System.out.println("Hello " + name);
    }
}
```

Micronaut's validation guide shows that invalid method calls result in `jakarta.validation.ConstraintViolationException`.

### Validating Objects Manually

Micronaut also supports injecting a `Validator` and validating objects directly:

```java
import jakarta.inject.Inject;
import jakarta.validation.Validator;
import java.util.Set;
import jakarta.validation.ConstraintViolation;

public class ValidationExample {

    @Inject
    Validator validator;

    public Set<ConstraintViolation<CreateUserRequest>> validate(CreateUserRequest request) {
        return validator.validate(request);
    }
}
```

This is useful when validation happens outside the HTTP layer or outside automatic bean method interception.

### Nested Object Validation

Micronaut's guide also shows `@Valid` for cascaded validation of nested objects:

```java
import jakarta.inject.Singleton;
import jakarta.validation.Valid;

@Singleton
public class RegistrationService {

    public void register(@Valid CreateUserRequest request) {
        // business logic
    }
}
```

### One Important Micronaut Nuance

Micronaut's own validation documentation explicitly notes that its default implementation is not fully compliant with the Bean Validation specification because the full spec relies heavily on reflection-based APIs. The guide lists unsupported areas such as the constraint metadata API and XML-based configuration.

That is not automatically a problem. In many Micronaut applications, the default validator is exactly what you want because it is lighter and more native-image-friendly.

But if you need full Bean Validation compliance, Micronaut's docs recommend using:

```gradle
dependencies {
    implementation("io.micronaut.beanvalidation:micronaut-hibernate-validator")
}
```

That distinction matters in real projects.

## When You Should Use Bean Validation

Jakarta Bean Validation is a strong fit when:

- you are validating DTOs coming into HTTP endpoints
- you want method-level parameter checks on service boundaries
- you need simple, declarative field rules
- you want nested object validation with minimal boilerplate
- you want framework-generated error handling to stay consistent

It is especially effective for structural rules:

- required fields
- string length
- numeric ranges
- basic formats
- collection size

If your rule is stable, deterministic, and local to the object or method contract, Bean Validation is usually a good choice.

## When You Should Avoid It

This is the part many teams get wrong. Bean Validation is not a substitute for all validation.

Avoid putting these kinds of rules directly into Bean Validation annotations:

- heavy database lookups
- cross-service network calls
- business workflows with side effects
- authorization rules
- highly contextual rules that depend on the current user, feature flags, or external state

Examples:

- "email must be unique" is usually not a Bean Validation concern by itself
- "user can only approve invoices for their department" is not a Bean Validation concern
- "you cannot cancel an order after shipping started" is domain logic, not DTO validation

Those belong in domain services, policies, or persistence constraints.

A good rule of thumb:

- Bean Validation for shape and contract
- domain logic for business meaning

## Best Practices

Use these habits if you want Bean Validation to stay helpful:

- Keep DTO validation close to the API boundary.
- Use service-level method validation for reusable internal contracts.
- Prefer specific constraints over generic `@Pattern` when a built-in annotation exists.
- Keep custom validators fast and side-effect free.
- Return clean validation errors instead of leaking raw exception text directly to clients.
- Back critical invariants with database constraints as well.

That last point matters. Validation annotations improve developer ergonomics, but they do not replace database uniqueness, foreign keys, or transaction-safe checks.

## Spring Boot vs Micronaut at a Glance

| Topic                | Spring Boot                                               | Micronaut                                              |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| Basic annotations    | `jakarta.validation.*`                                    | `jakarta.validation.*`                                 |
| Common setup         | `spring-boot-starter-validation`                          | `micronaut-validation` + processor                     |
| Method validation    | typically `@Validated` on bean                            | constraint annotations on bean methods                 |
| Manual validation    | inject `Validator`                                        | inject `Validator`                                     |
| Message integration  | integrates with `MessageSource`                           | supported, but different infrastructure                |
| Full spec compliance | usually via standard provider such as Hibernate Validator | default validator is lighter, not fully spec-compliant |

Neither approach is universally better. Spring Boot gives you familiar integration with a widely used validator stack. Micronaut gives you a more compile-time-oriented model that fits well when startup time, native image support, and reflection reduction matter.

If you are also comparing the broader framework tradeoffs, I already covered Micronaut more generally in [micronaut-modern-microservices-framework-2025.md](/Users/fernandonogueira/workspace/pessoal/blog/content/blog/micronaut-modern-microservices-framework-2025.md) and Spring runtime choices in [spring-boot-vs-spring-webflux-when-to-use-performance-comparison.md](/Users/fernandonogueira/workspace/pessoal/blog/content/blog/spring-boot-vs-spring-webflux-when-to-use-performance-comparison.md).

## Conclusion

Jakarta Bean Validation is one of those Java features that looks small until you stop using it and realize how much repetitive validation code it was quietly removing for you.

Use it for clear, declarative contract rules at your application boundaries. Do not use it as a dumping ground for business workflows, database-heavy checks, or authorization logic.

If you stay disciplined about that boundary, Bean Validation works very well with both Spring Boot and Micronaut. It keeps your models honest, your endpoints cleaner, and your validation behavior more predictable.

## References

- [Jakarta EE Tutorial: Introduction to Jakarta Bean Validation](https://jakarta.ee/learn/docs/jakartaee-tutorial/current/beanvalidation/bean-validation/bean-validation.html)
- [Spring Boot Reference: Validation](https://docs.spring.io/spring-boot/reference/io/validation.html)
- [Spring Framework Reference: Java Bean Validation](https://docs.spring.io/spring-framework/reference/core/validation/beanvalidation.html)
- [Spring Framework Reference: MVC Validation](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html)
- [Micronaut Validation Guide](https://micronaut-projects.github.io/micronaut-validation/latest/guide/)
- [Micronaut Hibernate Validator Guide](https://micronaut-projects.github.io/micronaut-hibernate-validator/latest/guide/)
