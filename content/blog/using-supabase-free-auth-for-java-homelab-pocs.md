---
title: "Using Supabase Free Auth for Java HomeLab POCs: JWT, Social Login, and Security"
date: "2026-05-16"
description: "How to leverage Supabase's free authentication system with JWT, social login, and Row Level Security to speed up Java API development for homeLabs and proof-of-concepts."
tags:
  [
    "supabase",
    "auth",
    "jwt",
    "java",
    "spring-boot",
    "micronaut",
    "oauth",
    "security",
    "homelab",
    "poc",
  ]
---

Picture this: you've got a brilliant API idea brewing, but before you write a single endpoint, you need user accounts, password resets, social logins, and some way to protect your routes. Suddenly your weekend project turned into an OAuth 2.0 specification reading session, and you're three hours deep comparing Keycloak vs Auth0 vs rolling your own.

I've been there. Authentication is the silent killer of side project momentum. That's where **Supabase Auth** comes in — it gives you a complete, production-ready auth system for free, and you can wire it into your Java backend with nothing more than standard JWT validation.

## What Is Supabase Auth (and Why It Fits Java Backends)

Supabase Auth is a complete user management system built into every Supabase project. It's not an external service you bolt on — it lives in the same Postgres database and uses standard JWT tokens that any Java backend can validate.

What you get out of the box:

- **Email/password authentication** with secure hashing (bcrypt)
- **Social OAuth providers** — Google, GitHub, GitLab, Discord, Twitter/X, Azure, and more
- **Magic links** — passwordless login via email
- **Anonymous authentication** — create temporary user sessions without any credentials
- **JWT-based sessions** with configurable expiry
- **Row Level Security (RLS)** — database-level access control tied to the authenticated user
- **Auth hooks** — customize JWT claims, intercept sign-in events, send custom emails

For Java developers, the key insight is this: **Supabase Auth emits standard JWTs**. Your Spring Boot or Micronaut app doesn't need a Supabase SDK. It just needs to validate a JWT using the project's public key. That's it.

## The Free Tier: What's Included for Auth?

The free plan is surprisingly generous for auth-heavy POCs:

| Auth Feature                         | Free Tier Limit                     |
| ------------------------------------ | ----------------------------------- |
| Monthly Active Users (MAU)           | **50,000**                          |
| Total Users (registered)             | **Unlimited**                       |
| Social OAuth providers               | **Included** (Google, GitHub, etc.) |
| Anonymous sign-ins                   | **Included**                        |
| Custom SMTP server                   | **Included**                        |
| Basic Multi-Factor Auth (TOTP)       | **Included**                        |
| Auth Audit Logs                      | **1 hour** retention                |
| Remove Supabase branding from emails | ❌ Not included                     |
| Advanced MFA (Phone/SMS)             | ❌ Not included                     |
| Single Sign-On (SAML 2.0)            | ❌ Not included                     |
| Leaked password protection           | ❌ Not included                     |
| Single session per user              | ❌ Not included                     |
| Session timeouts                     | ❌ Not included                     |
| Auth Hooks (JWT customization)       | **Included**                        |

The 50,000 MAU limit is the big one. For a homeLab or side project, you'll likely never touch it. Even if your POC gains some traction, that's a lot of active users before you need to think about the $25/mo Pro plan.

The main gotchas:

1. **Auth audit logs only last 1 hour** — great for debugging, terrible for forensics. Don't rely on them for security investigations
2. **No leaked password protection** — users can reuse passwords from breached databases. Consider adding your own check with Have I Been Pwned API for sensitive projects
3. **No session timeouts or single-session enforcement** — users can stay logged in indefinitely on multiple devices
4. **Supabase branding on auth emails** — fine for POCs, but you'll want to upgrade before any real product launch
5. **7-day project pause** — same as the database, your auth system goes to sleep after a week of inactivity

## Architecture: How It All Fits Together

Here's the typical flow I use for Java APIs with Supabase Auth:

```
┌─────────────┐     JWT + API Key      ┌─────────────────┐
│   Frontend  │ ────────────────────▶ │  Supabase Auth  │
│  (React/etc)│ ◀──────────────────── │   (login/signup) │
└─────────────┘    JWT token          └─────────────────┘
       │                                        │
       │ JWT in Authorization header            │
       ▼                                        ▼
┌─────────────────────────────────────────────────────────┐
│              Java Backend (Spring Boot / Micronaut)      │
│  1. Extract JWT from header                              │
│  2. Validate signature with Supabase public key          │
│  3. Extract user ID from JWT claims (sub)              │
│  4. Proceed with request or return 401                   │
└─────────────────────────────────────────────────────────┘
```

The frontend handles all the UI for login, signup, password reset, social auth. Supabase Auth handles the token issuance. Your Java backend just validates the token and trusts the `sub` claim as the user ID.

## Setting Up Supabase Auth

Before writing Java code, configure your Supabase project:

1. Go to your Supabase project dashboard → **Authentication**
2. Under **Providers**, enable the ones you need:
   - **Email** — always enabled, configure confirmation email settings
   - **Google** — add your OAuth client ID and secret from Google Cloud Console
   - **GitHub** — add client ID and secret from GitHub Developer Settings
   - Others as needed
3. Under **URL Configuration**, set your site URL and redirect URLs (e.g., `http://localhost:3000/auth/callback` for local dev)
4. Copy your **Project API Keys** from Project Settings → API:
   - `anon` key — safe to expose in frontend, used for public Supabase client operations
   - `service_role` key — **never expose**, full admin access, use only in server-side Java code

The JWT secret you need for validation is also in **Project Settings → API → JWT Settings → JWT Secret**. But actually, the better approach is to use the **public key** for JWT signature verification rather than sharing the secret.

## Java Integration: Validating Supabase JWTs in Spring Boot

Add the JWT dependency to your `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

Configure your `application.properties`:

```properties
# Supabase project URL and public key
supabase.url=https://xxxxxxxx.supabase.co
supabase.anon-key=eyJhbGciOiJIUzI1NiIs...
supabase.jwt-secret=your-jwt-secret-here

# Spring Security JWT configuration
spring.security.oauth2.resourceserver.jwt.issuer-uri=${supabase.url}
```

Now create a JWT decoder that validates Supabase tokens. The trick is that Supabase uses HS256 (HMAC with SHA-256) by default, not RS256. This means you use the JWT secret for validation:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${supabase.jwt-secret}")
    private String jwtSecret;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/experiments/**").authenticated()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.decoder(jwtDecoder()))
            );
        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        // Supabase uses HS256 (HMAC) by default with the JWT secret
        SecretKeySpec secretKey = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(secretKey).build();

        OAuth2TokenValidator<Jwt> withIssuer = JwtValidators.createDefaultWithIssuer("https://xxxxxxxx.supabase.co/auth/v1");
        OAuth2TokenValidator<Jwt> validator = new DelegatingOAuth2TokenValidator<>(withIssuer, token -> {
            // Custom validation: ensure token is not expired and has subject
            if (token.getSubject() == null || token.getSubject().isEmpty()) {
                return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Missing subject claim", null));
            }
            return OAuth2TokenValidatorResult.success();
        });
        decoder.setJwtValidator(validator);

        return decoder;
    }
}
```

Then in your controllers, access the authenticated user:

```java
@RestController
@RequestMapping("/api/experiments")
public class ExperimentController {

    @GetMapping("/mine")
    public List<Experiment> myExperiments(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject(); // The 'sub' claim = Supabase user UUID
        return experimentRepository.findByUserId(userId);
    }

    @PostMapping
    public Experiment create(@RequestBody Experiment experiment, @AuthenticationPrincipal Jwt jwt) {
        experiment.setUserId(jwt.getSubject());
        return experimentRepository.save(experiment);
    }
}
```

The `sub` claim contains the user's UUID from Supabase. This is your foreign key into any user-related tables.

## Working with Supabase User Data from Java

Sometimes you need more than the UUID — you need the user's email, metadata, or role. You can either:

**Option A: Decode the JWT claims** (no extra network call)

```java
// JWT payload contains these standard claims:
// sub: user UUID
// email: user's email (if using email provider)
// role: 'authenticated' or 'anon'
// app_metadata: { provider: 'email' }
// user_metadata: { name: 'Fernando', avatar: '...' }

String email = jwt.getClaimAsString("email");
String userName = jwt.getClaimAsString("user_metadata"); // JSON object, parse accordingly
```

**Option B: Call Supabase Auth Admin API** (for server-side operations)

```java
@Service
public class SupabaseUserService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key}")
    private String serviceRoleKey; // NEVER expose this key!

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> getUserById(String userId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + serviceRoleKey);
        headers.set("apikey", serviceRoleKey);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
            supabaseUrl + "/auth/v1/admin/users/" + userId,
            HttpMethod.GET,
            request,
            Map.class
        );

        return response.getBody();
    }

    public List<Map<String, Object>> listAllUsers() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + serviceRoleKey);
        headers.set("apikey", serviceRoleKey);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
            supabaseUrl + "/auth/v1/admin/users",
            HttpMethod.GET,
            request,
            Map.class
        );

        return (List<Map<String, Object>>) response.getBody().get("users");
    }
}
```

**Critical security note:** The `service_role` key bypasses all RLS policies and has god-mode access. Store it in environment variables, never log it, never return it to clients.

## Row Level Security: The Real Superpower

This is where Supabase Auth becomes genuinely powerful for Java backends. RLS lets you enforce access control at the database level, not just the API level.

Here's an example: you have an `experiments` table, and each experiment belongs to a user. You create an RLS policy:

```sql
-- Enable RLS on the table
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;

-- Users can only see their own experiments
CREATE POLICY "Users can only access their own experiments"
ON experiments
FOR ALL
TO authenticated
USING (user_id = auth.uid());
```

Now, when your Java backend queries the database using the `anon` key with the user's JWT in the `Authorization` header:

```java
// Using Supabase Java client (community library)
SupabaseClient client = SupabaseClient.create(supabaseUrl, anonKey);
client.auth.setAuth(jwtToken); // User's JWT from frontend

// This query automatically respects RLS — only returns rows where user_id matches
List<Experiment> results = client.from("experiments")
    .select()
    .execute();
```

Or if you're using raw JDBC with the pooler connection:

```sql
-- Set the JWT session claim
SET LOCAL request.jwt.claim.sub = 'user-uuid-here';
SET LOCAL request.jwt.claim.role = 'authenticated';

-- Now queries respect RLS policies
SELECT * FROM experiments;
```

For pure Java backends, I typically handle authorization in the application layer (Spring Security) and use RLS as a defense-in-depth measure for direct database access.

## Social Login Setup for Java Backends

When a user signs in with Google or GitHub via Supabase, the flow is:

1. Frontend calls `supabase.auth.signInWithOAuth({ provider: 'github' })`
2. Supabase redirects to the OAuth provider
3. User authenticates and is redirected back to your app
4. Supabase exchanges the code for tokens and creates/updates the user
5. Frontend receives the JWT and sends it to your Java backend

Your Java backend **doesn't handle the OAuth dance at all**. It just receives the final JWT. This is beautiful — no OAuth redirect URL configuration in Java, no state parameter management, no token exchange logic.

Just validate the JWT and extract the user ID. The provider information is in `app_metadata.provider`:

```java
String provider = jwt.getClaimAsString("app_metadata"); // Contains: {"provider": "github"}
String email = jwt.getClaimAsString("email"); // Verified email from GitHub
```

## Anonymous Authentication for Quick Experiments

Supabase supports anonymous sign-ins, which is perfect for POCs where you want users to try the app before committing to an account:

```javascript
// Frontend
const { data, error } = await supabase.auth.signInAnonymously()
// Returns a JWT for a temporary user
```

The JWT works exactly the same way in your Java backend. The user has a UUID in the `sub` claim, but no email. You can later "upgrade" the anonymous user to a real account by linking an email/password or social login.

For Java backends, anonymous users look just like regular users — same JWT format, same validation logic. Just check if the `email` claim is null if you need to distinguish them.

## Maximizing Free Auth for Development Velocity

Here are my practical tips for staying within free tier limits while moving fast:

### 1. Use Separate Projects for Different Stages

With 2 free projects, I usually set up:

- One project for **active development** (frequent auth flows, testing)
- One project for **stable demos** (showing to colleagues, minimal changes)

This prevents your demo project from getting cluttered with test users and weird auth states.

### 2. Clean Up Test Users Regularly

The "Total Users" count is unlimited, but a messy user table makes debugging harder. Use the Supabase dashboard to delete test accounts, or use the Admin API from a Java test utility:

```java
// Delete a test user (service_role key required)
public void deleteTestUser(String userId) {
    HttpHeaders headers = new HttpHeaders();
    headers.set("Authorization", "Bearer " + serviceRoleKey);
    headers.set("apikey", serviceRoleKey);

    restTemplate.exchange(
        supabaseUrl + "/auth/v1/admin/users/" + userId,
        HttpMethod.DELETE,
        new HttpEntity<>(headers),
        Void.class
    );
}
```

### 3. Mock Auth for Unit Tests

Don't hit Supabase Auth in your unit tests. Create a test JWT generator:

```java
@Component
public class TestJwtFactory {

    public String createTestJwt(String userId, String email) {
        // Use jjwt library
        return Jwts.builder()
            .subject(userId)
            .claim("email", email)
            .claim("role", "authenticated")
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + 3600000))
            .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()), Jwts.SIG.HS256)
            .compact();
    }
}
```

### 4. Use the Session Endpoint for Token Refresh

Supabase JWTs expire (default: 1 hour). The frontend should handle refreshing them using Supabase's client library. Your Java backend just needs to return `401` when a token is expired — the frontend will refresh and retry.

```java
@RestControllerAdvice
public class AuthExceptionHandler {

    @ExceptionHandler(JwtException.class)
    public ResponseEntity<Map<String, String>> handleJwtException(JwtException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("error", "Token expired or invalid", "code", "TOKEN_EXPIRED"));
    }
}
```

### 5. Don't Build Admin Dashboards on Free Tier

The 1-hour auth audit log retention makes user activity tracking pointless. If you need an admin panel with user management, build it locally with direct database queries, or upgrade to Pro for 7-day retention.

## Attention Points and Gotchas

Before you commit to Supabase Auth for a POC, here are the sharp edges I've hit:

### JWT Secret Rotation

If you rotate the JWT secret in Supabase dashboard, all existing tokens immediately become invalid. Your Java backend will start rejecting every request until users re-authenticate. During development, this is fine. For anything with real users, plan rotation windows carefully.

### The `auth.users` Table Is Special

Don't directly modify the `auth.users` table from Java/JDBC. It's managed by Supabase Auth internals. Use the Admin API or Supabase client for user operations. Reading from it is fine (it's just a Postgres table), but writes can break auth state.

### RLS and Service Role Key

When your Java backend uses the `service_role` key, **all RLS policies are bypassed**. This is by design — the service role is meant for admin operations. But it means you must implement authorization in your Java code when using this key:

```java
@Service
public class SecureExperimentService {

    @Autowired
    private ExperimentRepository repository;

    public Experiment getExperiment(Long id, Jwt userJwt) {
        String userId = userJwt.getSubject();
        Experiment experiment = repository.findById(id)
            .orElseThrow(() -> new NotFoundException("Experiment not found"));

        // Manual authorization check (RLS is bypassed with service_role key)
        if (!experiment.getUserId().equals(userId)) {
            throw new AccessDeniedException("Not your experiment");
        }

        return experiment;
    }
}
```

### Email Deliverability

Supabase sends emails from their own infrastructure on the free tier. These sometimes land in spam folders. For a real project, configure a custom SMTP server (SendGrid, AWS SES, etc.) — this is included even on the free tier, which is nice.

### Phone MFA Costs

Basic TOTP MFA (Google Authenticator style) is free. But if you want SMS-based MFA, that's a paid add-on ($75/mo for the first project). For POCs, stick to TOTP or skip MFA entirely.

### No Custom Claims in Free Tier (Without Hooks)

If you need custom JWT claims (like `role: admin` or `plan: pro`), you need to use **Auth Hooks** to modify the JWT payload during sign-in. This is included on free tier but requires writing a small Postgres function. It's not as straightforward as Auth0's rule engine.

## When to Upgrade from Free Auth

The free auth tier starts feeling tight when:

- You need **leaked password protection** (check against breach databases)
- You need **SSO/SAML** for enterprise customers
- You need **phone-based MFA** for compliance
- You need **session timeout enforcement** (users logged in for 30 days max)
- You need **single session per user** (prevent account sharing)
- You need **audit logs beyond 1 hour** for security investigations
- You need **custom domains for auth emails** (brand trust)

The **Pro plan at $25/month** unlocks most of these. For a side project with actual users, that's reasonable. For pure experimentation, free is more than enough.

## My Typical Auth-Enabled POC Workflow

Here's how I actually use Supabase Auth for Java experiments:

1. **Monday**: Create Supabase project, enable Email + GitHub providers (5 minutes)
2. **Wire up Spring Security** with JWT validation (30 minutes, mostly copy-paste from previous projects)
3. **Build the frontend login UI** — usually a simple React page using Supabase Auth UI helpers
4. **Protect API endpoints** with `@PreAuthorize` or `SecurityFilterChain`
5. **Add user-scoped data** — every table gets a `user_id` column referencing `auth.users.id`
6. **Test social login flow** end-to-end
7. **Iterate for a week** — the auth system just works, I focus on business logic
8. **If the POC dies**: delete the project, zero auth-related cleanup needed

The setup from "zero auth" to "GitHub login working with Java backend" is consistently under **45 minutes** for a new project.

## Conclusion

Supabase Auth removes the "authentication tax" from side projects entirely. You don't need to understand OAuth 2.0 flows, don't need to manage session stores, don't need to hash passwords or send reset emails. Your Java backend just validates JWTs — something Spring Security and Micronaut do natively.

For homeLabs and POCs, the free tier's 50,000 MAU is essentially unlimited. The real limitations (1-hour audit logs, no SMS MFA, no SSO) only matter once your project graduates from experiment to product.

My recommendation: stop building authentication infrastructure for your side projects. Create a Supabase project, wire up JWT validation in Spring Boot or Micronaut, and spend that saved time on the features that actually matter. When your POC gains traction, the upgrade path to paid plans is straightforward — and by then, you'll know exactly which auth features you actually need.

## References

- [Supabase Auth Documentation](https://supabase.com/auth)
- [Supabase Pricing & Free Tier Limits](https://supabase.com/pricing)
- [Supabase JWT Validation Guide](https://supabase.com/docs/guides/auth/server-side/jwt-verification)
- [Spring Security OAuth2 Resource Server](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/index.html)
- [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser)
- [Row Level Security in PostgreSQL](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
