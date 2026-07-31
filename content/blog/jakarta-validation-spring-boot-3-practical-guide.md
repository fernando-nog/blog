---
title: "Jakarta Validation in Spring Boot 3: A Practical Guide with Examples"
date: "2026-07-31"
description: "A hands-on guide to Jakarta Bean Validation in Spring Boot 3, covering setup, @Valid vs @Validated, custom validators, exception handling, testing, and common troubleshooting fixes."
tags:
  [
    "java",
    "spring-boot",
    "jakarta",
    "bean-validation",
    "validation",
    "backend-development",
    "rest-api",
  ]
---

You added `@NotBlank` to your DTO, annotated the controller with `@Valid`, and still got a `400` with no field details. Or worse, the request went straight through and saved invalid data. If you've upgraded from Spring Boot 2 to 3, you probably also hit the `javax.validation` versus `jakarta.validation` import confusion at least once.

I've been through all of these. After wiring validation into enough Spring Boot services, I now treat it as three distinct concerns: **input shape** at the API boundary, **method contracts** inside services, and **custom rules** that annotations alone can't express. This post shows how to handle all three in Spring Boot 3 without turning your controllers into defensive `if` statements.

## What This Post Covers

This is a Spring Boot 3 only, example-driven guide. We'll build a small project and cover:

- The exact dependency you need
- `@Valid` versus `@Validated` and when to use each
- A complete REST example with a custom error response
- Nested and collection validation
- Custom constraints with `ConstraintValidator`
- Validation groups for multi-step forms
- Testing validation with `@WebMvcTest`
- A troubleshooting checklist for the most common failures

If you want the conceptual comparison between Spring Boot and Micronaut, I covered that in [Introduction to Jakarta Bean Validation](./introduction-to-jakarta-bean-validation-with-spring-boot-and-micronaut/). Here we stay focused on Spring Boot 3.

## Project Setup

Create a project with Spring Initializr. The only required dependency is:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

Or with Gradle:

```gradle
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-validation")
}
```

That starter pulls in the Jakarta Validation API plus a provider such as Hibernate Validator. You usually do **not** need `jakarta.validation-api` as an explicit dependency.

Make sure your imports use `jakarta.validation.constraints.*`, not `javax.validation.constraints.*`. This is the most common mistake after migrating from Spring Boot 2.

## `@Valid` Versus `@Validated`

This distinction trips up almost everyone. Use this rule:

- **`@Valid`** triggers validation of an object and walks into nested fields. Put it on request bodies, nested objects, and collections.
- **`@Validated`** is Spring-specific and enables method-level validation on Spring beans. Put it on service classes when you want parameter or return value constraints.

A controller only needs `@Valid`:

```java
@PostMapping("/users")
public ResponseEntity<Void> createUser(@RequestBody @Valid CreateUserRequest request) {
    // ...
}
```

A service needs `@Validated` if you declare constraints directly on method parameters:

```java
@Service
@Validated
public class UserService {

    public void changePassword(
        @NotBlank String userId,
        @Size(min = 12, max = 128) String newPassword
    ) {
        // ...
    }
}
```

Without `@Validated`, the annotations on `changePassword` are ignored. That is the single most common reason method validation "doesn't work."

## A Complete REST Example

Let's define a realistic request DTO:

```java
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateUserRequest {

    @NotBlank
    @Size(min = 2, max = 100)
    private String name;

    @NotBlank
    @Email
    private String email;

    @NotNull
    @Size(min = 12, max = 128)
    private String password;

    @Size(max = 500)
    private String bio;

    // getters and setters
}
```

Then the controller:

```java
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
public class UserController {

    @PostMapping
    public ResponseEntity<Void> createUser(@RequestBody @Valid CreateUserRequest request) {
        return ResponseEntity.ok().build();
    }
}
```

If you post an empty payload, Spring MVC throws `MethodArgumentNotValidException`. The default response is a generic `400 Bad Request`. Most teams want a structured error body instead.

## Clean Error Responses with `@ControllerAdvice`

Spring 6 and Boot 3 support `ProblemDetail`, but a simple field-error map is often enough:

```java
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class ValidationExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach(error -> {
            String field = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            errors.put(field, message);
        });

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }
}
```

Now an invalid request returns something like:

```json
{
  "name": "must not be blank",
  "email": "must be a well-formed email address"
}
```

For a more standardized shape, replace the map with a small `ValidationError` record that also includes the rejected value and an error code.

## Nested and Collection Validation

Bean Validation walks into nested objects only if you add `@Valid`:

```java
public class CreateOrderRequest {

    @NotBlank
    private String customerId;

    @Valid
    @NotEmpty
    private List<OrderItem> items;

    // getters and setters
}
```

```java
public class OrderItem {

    @NotBlank
    private String sku;

    @Min(1)
    private int quantity;

    // getters and setters
}
```

If you forget `@Valid` on the `items` list, the constraints inside `OrderItem` are ignored. This is the second most common failure I see.

For collections of simple values, you can also use type-use annotations:

```java
private List<@NotBlank String> tags;
```

Not all validators support this uniformly, so test it if you rely on it.

## Custom Constraints with `ConstraintValidator`

Built-in annotations cover shape. They do not cover business rules such as "password cannot equal the email" or "sku must match our internal format."

Define the annotation:

```java
import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Constraint(validatedBy = SkuValidator.class)
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface Sku {
    String message() default "Invalid SKU format";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
```

Then the validator:

```java
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class SkuValidator implements ConstraintValidator<Sku, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true; // let @NotBlank handle the required check
        }
        return value.matches("^[A-Z]{2}-[0-9]{6}$");
    }
}
```

Use it like any other annotation:

```java
@Sku
private String sku;
```

Keep validators free of heavy side effects. Do not inject repositories into validators if you can avoid it; that couples validation to persistence and makes tests harder. If you absolutely must query the database, do it in a service method and add the custom check there.

## Validation Groups

Groups let you apply different rules in different contexts. A typical case is a multi-step wizard where step 1 validates only identity fields and step 2 validates payment details.

Define marker interfaces:

```java
public interface OnCreate {}
public interface OnUpdate {}
```

Apply them:

```java
public class UserRequest {

    @NotNull(groups = OnUpdate.class)
    private Long id;

    @NotBlank(groups = {OnCreate.class, OnUpdate.class})
    private String name;

    // ...
}
```

In the controller, use `@Validated` with the group:

```java
@PostMapping
public ResponseEntity<Void> create(
    @RequestBody @Validated(OnCreate.class) UserRequest request
) {
    // ...
}
```

Note: in the grouped case you use `@Validated`, not `@Valid`, because `@Valid` does not support groups in this controller context.

## Testing Validation

Use `@WebMvcTest` to verify the integration between controller and validation:

```java
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@Import(ValidationExceptionHandler.class)
class UserControllerValidationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldRejectInvalidEmail() throws Exception {
        String payload = """
            {
              "name": "Fernando",
              "email": "not-an-email",
              "password": "validPassword123"
            }
            """;

        mockMvc.perform(post("/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.email").exists());
    }
}
```

If you want to test a validator in isolation, use `ValidatorFactory`:

```java
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;

class SkuValidatorTest {

    @Test
    void shouldRejectMalformedSku() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();

            OrderItem item = new OrderItem();
            item.setSku("bad-sku");
            item.setQuantity(1);

            assertFalse(validator.validate(item).isEmpty());
        }
    }
}
```

## Troubleshooting Checklist

When validation is not working, go through this list before Stack Overflow.

### 1. Wrong import package

Spring Boot 3 uses `jakarta.validation.constraints.*`. If your IDE auto-imported `javax.validation.constraints.NotBlank`, validation is silently ignored in many cases.

### 2. Missing `spring-boot-starter-validation`

The starter is required. `spring-boot-starter-web` alone does not pull it in.

### 3. Forgetting `@Valid` or `@Validated`

- Request bodies and nested objects need `@Valid`.
- Service method parameters need `@Validated` on the class.
- Group validation in controllers needs `@Validated(Group.class)`.

### 4. Lombok or immutable classes without getters

Hibernate Validator reads properties through getters. A Lombok `@Value` or Java record works fine, but if you hand-write a class with only fields and no accessors, validation may not bind correctly.

### 5. Method validation called from the same bean

Spring method validation works through proxies. If you call a validated method from another method inside the same bean, the proxy is bypassed and validation does not fire. This is the same AOP limitation that affects `@Transactional`.

### 6. `@NotBlank` on non-String fields

`@NotBlank` is for `CharSequence` only. Using it on `Integer` or `LocalDate` will fail at startup.

### 7. Confusing `jakarta.persistence` with `jakarta.validation`

`jakarta.persistence.Column(nullable = false)` is JPA. `jakarta.validation.constraints.NotNull` is Bean Validation. They look similar but serve different layers.

## Putting It Together: A Minimal Structure

For a typical Spring Boot 3 service, this is the validation layer I aim for:

- **DTOs** with Jakarta annotations for shape and basic format.
- **Controllers** with `@Valid` and a global `@ControllerAdvice` for clean errors.
- **Services** with `@Validated` and method-level constraints for internal contracts.
- **Custom validators** for rules that are reusable and persistence-free.
- **Domain logic** for anything that requires database queries, state, or authorization.

That separation keeps Bean Validation where it shines and avoids the common trap of pushing business rules into annotation metadata.

## Conclusion

Jakarta Bean Validation in Spring Boot 3 is not complicated, but it has sharp edges around imports, proxying, and the `@Valid` / `@Validated` distinction. Once you internalize those three rules, the rest is mostly choosing the right annotation and keeping custom validators focused.

If you are also comparing frameworks, see my broader take in [Introduction to Jakarta Bean Validation](./introduction-to-jakarta-bean-validation-with-spring-boot-and-micronaut/). Otherwise, start with the setup in this post, add the global error handler, and write at least one `@WebMvcTest` for validation. That alone will save you from most of the silent failures that make validation feel unpredictable.

## References

- [Spring Boot Reference: Validation](https://docs.spring.io/spring-boot/reference/io/validation.html)
- [Spring Framework Reference: Java Bean Validation](https://docs.spring.io/spring-framework/reference/core/validation/beanvalidation.html)
- [Jakarta Bean Validation 3.0 Specification](https://beanvalidation.org/3.0/)
- [Hibernate Validator Documentation](https://docs.jboss.org/hibernate/stable/validator/reference/en-US/html_single/)
- [Baeldung: Validation in Spring Boot](https://www.baeldung.com/spring-boot-bean-validation)
