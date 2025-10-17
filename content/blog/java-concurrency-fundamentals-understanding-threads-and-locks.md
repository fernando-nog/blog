---
title: "Java Concurrency Fundamentals: Understanding Threads, Locks, and the Problems They Solve"
date: "2025-10-17"
description: "Master the core concepts of Java multithreading, from threads and locks to thread pools and deadlocks. Essential foundation for modern concurrent programming."
tags: ["java", "concurrency", "multithreading", "threads", "synchronization", "thread-pools"]
---

Picture this: You've built a REST API to process customer orders. It works great in testing. You deploy to production, and... it can only handle **one request at a time**. While user A's order is processing, users B, C, and D are waiting. Your boss is not happy. Your users are not happy. And you're wondering: "Why is this so slow?"

**Welcome to the world of concurrency problems.**

I remember the first time I encountered this. I had built what I thought was a perfectly good application, only to discover it was essentially a single-lane highway when it needed to be a multi-lane superhighway. The solution? Understanding how Java handles multiple tasks simultaneously—multithreading and concurrency.

In this post, I'll walk you through **everything you need to know about Java concurrency**, from the absolute basics to the common pitfalls that will bite you in production. By the end, you'll understand not just how to write multithreaded code, but why certain approaches work and others lead to 2 AM debugging sessions.

## What Are Threads? (And Why Should You Care)

Before we dive into code, let's understand what threads actually are and why they matter.

### The Single-Threaded Problem

Imagine you're running a restaurant with only one waiter. The waiter:
1. Takes order from table 1
2. Goes to kitchen
3. Waits for food
4. Brings food back
5. Then (and only then) moves to table 2

Tables 2, 3, 4, and 5 are waiting while your single waiter stands in the kitchen watching food cook. **This is single-threaded execution.**

Here's what it looks like in code:

```java
public class SingleThreadedServer {
    public static void main(String[] args) {
        while (true) {
            Request request = waitForRequest();      // Wait for request
            Response response = processRequest(request);  // Process it
            sendResponse(response);                  // Send response
            // Only NOW can we handle the next request!
        }
    }
    
    static Response processRequest(Request request) {
        // This takes 5 seconds
        callDatabase();        // 2 seconds
        callExternalAPI();     // 3 seconds
        return buildResponse();
    }
}
```

**Problem**: If processing takes 5 seconds, you can handle maximum 12 requests per minute. The 13th request? Waiting.

### Enter Threads: Multiple Workers

Now imagine your restaurant hires 10 waiters. Each can:
- Take orders independently
- Wait for different tables' food
- Serve multiple customers simultaneously

**This is multithreading.** Each waiter is a thread, working concurrently.

```java
public class MultiThreadedServer {
    public static void main(String[] args) {
        while (true) {
            Request request = waitForRequest();
            
            // Spawn a new thread for each request
            new Thread(() -> {
                Response response = processRequest(request);
                sendResponse(response);
            }).start();
            
            // Immediately ready for next request!
        }
    }
}
```

Now you can handle multiple requests simultaneously. Problem solved, right?

**Not quite.** This is where it gets interesting (and complex).

### Program vs Process vs Thread

Let's clarify some terminology:

- **Program**: Code sitting on your disk (e.g., `myapp.jar`)
- **Process**: A running instance of a program (when you execute `java myapp.jar`)
- **Thread**: A unit of execution within a process

One process can have multiple threads. They all share:
- The same memory space
- The same heap
- The same code
- The same open files

But each thread has its own:
- Execution path (can be at different lines of code)
- Call stack
- Local variables

Think of a process as a company, and threads as employees working in different departments but sharing the same office space and resources.

## Creating Your First Thread

Let's get our hands dirty with code. There are two main ways to create threads in Java.

### Method 1: Extending Thread Class

```java
public class MyThread extends Thread {
    private String taskName;
    
    public MyThread(String taskName) {
        this.taskName = taskName;
    }
    
    @Override
    public void run() {
        System.out.println(taskName + " started on " + Thread.currentThread().getName());
        
        // Simulate some work
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        System.out.println(taskName + " completed");
    }
    
    public static void main(String[] args) {
        MyThread thread1 = new MyThread("Task 1");
        MyThread thread2 = new MyThread("Task 2");
        MyThread thread3 = new MyThread("Task 3");
        
        thread1.start();  // NOT thread1.run()!
        thread2.start();
        thread3.start();
        
        System.out.println("All threads started on " + Thread.currentThread().getName());
    }
}
```

**Output:**
```
All threads started on main
Task 1 started on Thread-0
Task 2 started on Thread-1
Task 3 started on Thread-2
Task 1 completed
Task 2 completed
Task 3 completed
```

**Important**: Use `start()`, not `run()`!
- `start()`: Creates a new thread and runs code in that thread
- `run()`: Runs code in the current thread (defeats the purpose!)

### Method 2: Implementing Runnable (Preferred)

```java
public class MyTask implements Runnable {
    private String taskName;
    
    public MyTask(String taskName) {
        this.taskName = taskName;
    }
    
    @Override
    public void run() {
        System.out.println(taskName + " started on " + Thread.currentThread().getName());
        
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        System.out.println(taskName + " completed");
    }
    
    public static void main(String[] args) {
        Thread thread1 = new Thread(new MyTask("Task 1"));
        Thread thread2 = new Thread(new MyTask("Task 2"));
        Thread thread3 = new Thread(new MyTask("Task 3"));
        
        thread1.start();
        thread2.start();
        thread3.start();
    }
}
```

**Why prefer Runnable?**
- Java doesn't support multiple inheritance; if you extend `Thread`, you can't extend anything else
- Separates the task (what to do) from the thread (how to execute)
- More flexible and composable

### Modern Way: Lambda Expressions

With Java 8+, you can use lambdas for simple tasks:

```java
public class LambdaThreads {
    public static void main(String[] args) {
        Thread thread1 = new Thread(() -> {
            System.out.println("Task 1 running on " + Thread.currentThread().getName());
        });
        
        Thread thread2 = new Thread(() -> {
            System.out.println("Task 2 running on " + Thread.currentThread().getName());
        });
        
        thread1.start();
        thread2.start();
    }
}
```

Clean and concise!

### Thread Lifecycle States

A thread goes through several states during its life:

```
NEW → RUNNABLE → RUNNING → TERMINATED
         ↓           ↑
         ↓           ↑
         ↓      TIMED_WAITING
         ↓           ↑
         ↓           ↑
      BLOCKED  ←  WAITING
```

**States explained:**

1. **NEW**: Thread created but not started
2. **RUNNABLE**: Thread started and ready to run (waiting for CPU)
3. **RUNNING**: Thread is executing
4. **BLOCKED**: Waiting for a lock/monitor
5. **WAITING**: Waiting indefinitely for another thread
6. **TIMED_WAITING**: Waiting for a specified time (e.g., `Thread.sleep()`)
7. **TERMINATED**: Thread finished execution

## The Dark Side: Common Concurrency Problems

Now comes the fun part—where things can go horribly wrong. Multithreading introduces problems that simply don't exist in single-threaded code.

### Problem 1: Race Conditions

A **race condition** occurs when multiple threads access shared data and try to change it simultaneously.

Here's a classic example—a bank account:

```java
public class BankAccount {
    private int balance = 1000;
    
    public void withdraw(int amount) {
        // Check if sufficient balance
        if (balance >= amount) {
            // Simulate some processing time
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            
            // Withdraw the amount
            balance -= amount;
            System.out.println(Thread.currentThread().getName() + 
                " withdrew " + amount + ", balance: " + balance);
        } else {
            System.out.println(Thread.currentThread().getName() + 
                " insufficient funds");
        }
    }
    
    public int getBalance() {
        return balance;
    }
}

public class RaceConditionDemo {
    public static void main(String[] args) throws InterruptedException {
        BankAccount account = new BankAccount();
        
        // Two threads trying to withdraw simultaneously
        Thread wife = new Thread(() -> account.withdraw(800), "Wife");
        Thread husband = new Thread(() -> account.withdraw(800), "Husband");
        
        wife.start();
        husband.start();
        
        wife.join();
        husband.join();
        
        System.out.println("Final balance: " + account.getBalance());
    }
}
```

**Output:**
```
Wife withdrew 800, balance: 200
Husband withdrew 800, balance: -600
Final balance: -600
```

**Wait, what?!** We just allowed the account to go negative! Both threads checked the balance (1000), both saw it was sufficient, and both withdrew 800. We lost 600 that doesn't exist!

**This is a race condition.** The threads "raced" to access shared data, and the outcome depends on timing—unpredictable and wrong.

### Problem 2: Visibility Issues

Changes made by one thread might not be visible to other threads immediately:

```java
public class VisibilityDemo {
    private static boolean flag = false;
    
    public static void main(String[] args) throws InterruptedException {
        Thread writer = new Thread(() -> {
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            flag = true;
            System.out.println("Flag set to true");
        });
        
        Thread reader = new Thread(() -> {
            while (!flag) {
                // Waiting for flag to become true
                // This might loop forever!
            }
            System.out.println("Flag is now true!");
        });
        
        reader.start();
        writer.start();
    }
}
```

The reader thread might **never see** the flag change due to CPU caching and compiler optimizations. It could loop forever!

**Solution**: Use the `volatile` keyword:

```java
private static volatile boolean flag = false;
```

`volatile` ensures:
- Writes are immediately visible to all threads
- Reads always get the latest value

### Problem 3: Deadlock

A **deadlock** occurs when two or more threads are waiting for each other to release resources, creating a circular dependency.

Classic example:

```java
public class DeadlockDemo {
    private static final Object lock1 = new Object();
    private static final Object lock2 = new Object();
    
    public static void main(String[] args) {
        Thread thread1 = new Thread(() -> {
            synchronized (lock1) {
                System.out.println("Thread 1: Holding lock 1...");
                
                try { Thread.sleep(100); } catch (InterruptedException e) {}
                
                System.out.println("Thread 1: Waiting for lock 2...");
                synchronized (lock2) {
                    System.out.println("Thread 1: Holding lock 1 & 2");
                }
            }
        });
        
        Thread thread2 = new Thread(() -> {
            synchronized (lock2) {
                System.out.println("Thread 2: Holding lock 2...");
                
                try { Thread.sleep(100); } catch (InterruptedException e) {}
                
                System.out.println("Thread 2: Waiting for lock 1...");
                synchronized (lock1) {
                    System.out.println("Thread 2: Holding lock 1 & 2");
                }
            }
        });
        
        thread1.start();
        thread2.start();
    }
}
```

**Output:**
```
Thread 1: Holding lock 1...
Thread 2: Holding lock 2...
Thread 1: Waiting for lock 2...
Thread 2: Waiting for lock 1...
[Program hangs forever]
```

**What happened?**
- Thread 1 holds lock1, wants lock2
- Thread 2 holds lock2, wants lock1
- Both wait forever

This is like two people trying to pass through a doorway, each waiting for the other to go first. Nobody moves.

## Thread Synchronization: Making Things Safe

So how do we fix these problems? Enter **synchronization**.

### The synchronized Keyword

The `synchronized` keyword ensures that only one thread can execute a block of code at a time:

```java
public class BankAccountFixed {
    private int balance = 1000;
    
    // Method-level synchronization
    public synchronized void withdraw(int amount) {
        if (balance >= amount) {
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            
            balance -= amount;
            System.out.println(Thread.currentThread().getName() + 
                " withdrew " + amount + ", balance: " + balance);
        } else {
            System.out.println(Thread.currentThread().getName() + 
                " insufficient funds");
        }
    }
    
    public synchronized int getBalance() {
        return balance;
    }
}
```

Now when we run the same test:

```
Wife withdrew 800, balance: 200
Husband insufficient funds
Final balance: 200
```

**Perfect!** The `synchronized` keyword ensures only one thread can execute `withdraw()` at a time.

### How synchronized Works

When you use `synchronized`, Java uses a **monitor** (also called an intrinsic lock):

```java
// Synchronized method
public synchronized void method() {
    // Only one thread at a time
}

// Is equivalent to:
public void method() {
    synchronized(this) {
        // Only one thread at a time
    }
}
```

**Key points:**
- Every object in Java has a monitor
- Only one thread can hold a monitor at a time
- Other threads wait until the monitor is released

### Block-Level Synchronization

You don't always need to synchronize the entire method:

```java
public class Counter {
    private int count = 0;
    private final Object lock = new Object();
    
    public void increment() {
        // Non-critical code (doesn't need sync)
        System.out.println("About to increment");
        
        // Critical section (needs sync)
        synchronized (lock) {
            count++;
        }
        
        // More non-critical code
        System.out.println("Incremented");
    }
    
    public int getCount() {
        synchronized (lock) {
            return count;
        }
    }
}
```

**Benefits:**
- Faster execution (less time spent synchronized)
- More granular control
- Better concurrency (threads don't block unnecessarily)

### The Cost of Synchronization

Synchronization isn't free:

- **Performance overhead**: Acquiring and releasing locks takes time
- **Reduced concurrency**: Threads wait, reducing parallelism
- **Potential deadlocks**: More locks = more deadlock risk

**Rule of thumb**: Synchronize only what needs synchronization, and keep critical sections as small as possible.

## Explicit Locks: More Control

Sometimes `synchronized` isn't enough. You need more control. Enter `java.util.concurrent.locks`.

### ReentrantLock: A Better Lock

```java
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class BankAccountWithLock {
    private int balance = 1000;
    private final Lock lock = new ReentrantLock();
    
    public void withdraw(int amount) {
        lock.lock();  // Acquire lock
        try {
            if (balance >= amount) {
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                
                balance -= amount;
                System.out.println(Thread.currentThread().getName() + 
                    " withdrew " + amount + ", balance: " + balance);
            } else {
                System.out.println(Thread.currentThread().getName() + 
                    " insufficient funds");
            }
        } finally {
            lock.unlock();  // Always unlock in finally!
        }
    }
}
```

**Why use ReentrantLock over synchronized?**

### 1. Try-Lock: Avoid Blocking Forever

```java
public boolean tryWithdraw(int amount) {
    if (lock.tryLock()) {  // Try to acquire, don't block
        try {
            if (balance >= amount) {
                balance -= amount;
                return true;
            }
            return false;
        } finally {
            lock.unlock();
        }
    } else {
        System.out.println("Could not acquire lock, try again later");
        return false;
    }
}
```

### 2. Timeout: Wait for a Limited Time

```java
public boolean tryWithdrawWithTimeout(int amount) throws InterruptedException {
    if (lock.tryLock(1, TimeUnit.SECONDS)) {  // Wait max 1 second
        try {
            if (balance >= amount) {
                balance -= amount;
                return true;
            }
            return false;
        } finally {
            lock.unlock();
        }
    } else {
        System.out.println("Timeout waiting for lock");
        return false;
    }
}
```

### 3. Interruptible Lock Acquisition

```java
public void withdrawInterruptibly(int amount) throws InterruptedException {
    lock.lockInterruptibly();  // Can be interrupted while waiting
    try {
        if (balance >= amount) {
            balance -= amount;
        }
    } finally {
        lock.unlock();
    }
}
```

### 4. Fair Locks: First Come, First Served

```java
// Fair lock - threads acquire in order they requested
private final Lock fairLock = new ReentrantLock(true);

// Unfair lock (default) - faster but no guarantee of order
private final Lock unfairLock = new ReentrantLock(false);
```

**Fair locks** are slower but prevent thread starvation.

### When to Use Which?

**Use synchronized when:**
- Simple locking needs
- Don't need timeout or try-lock
- Want cleaner, more readable code

**Use ReentrantLock when:**
- Need try-lock or timeout functionality
- Need fair lock behavior
- Need to interrupt lock acquisition
- Need advanced features like conditions

## Thread Pools: Managing Threads Efficiently

Creating threads is expensive. Creating thousands of threads? **Terrible idea.**

### The Problem with Unlimited Threads

```java
// DON'T DO THIS!
public class BadServer {
    public static void main(String[] args) {
        while (true) {
            Request request = waitForRequest();
            
            // Create a new thread for every request!
            new Thread(() -> processRequest(request)).start();
        }
    }
}
```

**Problems:**
- Thread creation is expensive (memory, time)
- Each thread consumes ~1 MB of memory
- Context switching overhead increases
- Can exhaust system resources
- Eventually: `OutOfMemoryError`

### Enter Thread Pools

A **thread pool** maintains a pool of worker threads that can be reused:

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class GoodServer {
    private static final ExecutorService executor = Executors.newFixedThreadPool(10);
    
    public static void main(String[] args) {
        while (true) {
            Request request = waitForRequest();
            
            // Submit task to thread pool
            executor.submit(() -> processRequest(request));
        }
    }
}
```

**Benefits:**
- Threads are created once and reused
- Controlled number of concurrent threads
- Automatic task queuing when all threads are busy
- Better resource management

### Types of Thread Pools

#### 1. Fixed Thread Pool

```java
ExecutorService executor = Executors.newFixedThreadPool(10);

// Always has exactly 10 threads
// Tasks queue up if all threads are busy
```

**Use when:** You know the optimal thread count (usually number of CPU cores for CPU-bound tasks).

#### 2. Cached Thread Pool

```java
ExecutorService executor = Executors.newCachedThreadPool();

// Creates new threads as needed
// Reuses idle threads
// Terminates threads idle for 60 seconds
```

**Use when:** You have many short-lived tasks and unpredictable load.

#### 3. Single Thread Executor

```java
ExecutorService executor = Executors.newSingleThreadExecutor();

// Only one thread
// Tasks execute sequentially
```

**Use when:** You need guaranteed sequential execution (e.g., logging).

#### 4. Scheduled Thread Pool

```java
ScheduledExecutorService executor = Executors.newScheduledThreadPool(5);

// Schedule task to run after delay
executor.schedule(() -> {
    System.out.println("Runs after 5 seconds");
}, 5, TimeUnit.SECONDS);

// Schedule task to run periodically
executor.scheduleAtFixedRate(() -> {
    System.out.println("Runs every 10 seconds");
}, 0, 10, TimeUnit.SECONDS);
```

**Use when:** You need scheduled or periodic tasks.

### Complete Example: Processing Tasks

```java
import java.util.concurrent.*;
import java.util.List;
import java.util.ArrayList;

public class TaskProcessorDemo {
    public static void main(String[] args) throws InterruptedException, ExecutionException {
        ExecutorService executor = Executors.newFixedThreadPool(5);
        
        // Submit tasks and collect Futures
        List<Future<Integer>> futures = new ArrayList<>();
        
        for (int i = 1; i <= 10; i++) {
            final int taskId = i;
            Future<Integer> future = executor.submit(() -> {
                System.out.println("Processing task " + taskId + 
                    " on " + Thread.currentThread().getName());
                
                Thread.sleep(1000);  // Simulate work
                
                return taskId * 2;  // Return result
            });
            
            futures.add(future);
        }
        
        // Get results
        System.out.println("\nResults:");
        for (Future<Integer> future : futures) {
            System.out.println("Result: " + future.get());
        }
        
        // Shutdown executor
        executor.shutdown();
        executor.awaitTermination(1, TimeUnit.MINUTES);
        
        System.out.println("All tasks completed");
    }
}
```

### Proper Shutdown

Always shutdown executors properly:

```java
// Graceful shutdown
executor.shutdown();  // No new tasks accepted
executor.awaitTermination(60, TimeUnit.SECONDS);  // Wait for completion

// Forceful shutdown if needed
if (!executor.isTerminated()) {
    List<Runnable> droppedTasks = executor.shutdownNow();  // Interrupt running tasks
    System.out.println("Dropped " + droppedTasks.size() + " tasks");
}
```

## Concurrent Collections: Thread-Safe Data Structures

Regular collections aren't thread-safe. Using them from multiple threads leads to corruption.

### The Problem

```java
// NOT THREAD-SAFE!
Map<String, Integer> map = new HashMap<>();

// Multiple threads doing this = disaster
map.put("key", value);
```

**Result**: Data corruption, lost updates, crashes.

### Solution 1: Synchronized Collections (Old Way)

```java
Map<String, Integer> map = Collections.synchronizedMap(new HashMap<>());

// Now thread-safe, but...
// - Every operation is synchronized (slow)
// - Iteration still requires external synchronization
synchronized (map) {
    for (String key : map.keySet()) {
        // Must synchronize iteration!
    }
}
```

**Problems**: Poor performance, awkward iteration.

### Solution 2: Concurrent Collections (Better)

#### ConcurrentHashMap

```java
import java.util.concurrent.ConcurrentHashMap;

ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();

// Thread-safe operations
map.put("key", 1);
map.putIfAbsent("key", 2);  // Atomic: only put if absent

// Atomic updates
map.compute("counter", (key, oldValue) -> {
    return (oldValue == null) ? 1 : oldValue + 1;
});

// Atomic increment
map.computeIfPresent("counter", (key, oldValue) -> oldValue + 1);

// No external synchronization needed for iteration!
for (String key : map.keySet()) {
    System.out.println(key + ": " + map.get(key));
}
```

**Benefits:**
- Much faster than `Collections.synchronizedMap()`
- Lock-free reads
- Fine-grained locking for writes
- Safe iteration without external synchronization

#### CopyOnWriteArrayList

```java
import java.util.concurrent.CopyOnWriteArrayList;

List<String> list = new CopyOnWriteArrayList<>();

// Thread-safe add/remove
list.add("item1");
list.add("item2");

// Safe iteration (even if list is modified during iteration)
for (String item : list) {
    System.out.println(item);
    // Other threads can modify list safely
}
```

**Use when:**
- Many reads, few writes
- Iteration is more common than modification
- You can afford the copy cost on writes

#### BlockingQueue: Producer-Consumer Pattern

```java
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ArrayBlockingQueue;

public class ProducerConsumerDemo {
    public static void main(String[] args) {
        BlockingQueue<Integer> queue = new ArrayBlockingQueue<>(10);
        
        // Producer thread
        Thread producer = new Thread(() -> {
            try {
                for (int i = 0; i < 20; i++) {
                    queue.put(i);  // Blocks if queue is full!
                    System.out.println("Produced: " + i);
                    Thread.sleep(100);
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        });
        
        // Consumer thread
        Thread consumer = new Thread(() -> {
            try {
                for (int i = 0; i < 20; i++) {
                    Integer item = queue.take();  // Blocks if queue is empty!
                    System.out.println("Consumed: " + item);
                    Thread.sleep(300);
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        });
        
        producer.start();
        consumer.start();
    }
}
```

**Key methods:**
- `put()`: Add item, block if full
- `take()`: Remove item, block if empty
- `offer()`: Add item, return false if full (non-blocking)
- `poll()`: Remove item, return null if empty (non-blocking)

## The Future of Async: CompletableFuture

Sometimes you need to wait for a result from a thread. The old `Future` interface was limited. `CompletableFuture` is much more powerful.

### Basic Usage

```java
import java.util.concurrent.CompletableFuture;

public class CompletableFutureDemo {
    public static void main(String[] args) {
        // Run async task
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            System.out.println("Fetching data on " + Thread.currentThread().getName());
            
            try {
                Thread.sleep(2000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            
            return "Data from API";
        });
        
        // Do other work while waiting
        System.out.println("Doing other work...");
        
        // Get result (blocks until complete)
        try {
            String result = future.get();
            System.out.println("Result: " + result);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### Chaining Operations

```java
CompletableFuture.supplyAsync(() -> {
    // Step 1: Fetch user ID
    return fetchUserIdFromDatabase();
})
.thenApply(userId -> {
    // Step 2: Fetch user details
    return fetchUserDetails(userId);
})
.thenApply(userDetails -> {
    // Step 3: Transform data
    return userDetails.toUpperCase();
})
.thenAccept(result -> {
    // Step 4: Use result
    System.out.println("Final result: " + result);
})
.exceptionally(ex -> {
    // Handle any errors
    System.err.println("Error: " + ex.getMessage());
    return null;
});
```

### Combining Multiple Futures

```java
public class CombiningFutures {
    public static void main(String[] args) throws Exception {
        // Start multiple async operations
        CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> {
            sleep(1000);
            return "Result from API 1";
        });
        
        CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> {
            sleep(2000);
            return "Result from API 2";
        });
        
        CompletableFuture<String> future3 = CompletableFuture.supplyAsync(() -> {
            sleep(1500);
            return "Result from API 3";
        });
        
        // Wait for all to complete
        CompletableFuture<Void> allOf = CompletableFuture.allOf(future1, future2, future3);
        
        allOf.thenRun(() -> {
            try {
                System.out.println(future1.get());
                System.out.println(future2.get());
                System.out.println(future3.get());
            } catch (Exception e) {
                e.printStackTrace();
            }
        }).join();
        
        System.out.println("All tasks completed");
    }
    
    static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

### Why It Gets Complex

While powerful, `CompletableFuture` can lead to complex chains:

```java
CompletableFuture.supplyAsync(() -> fetchUser())
    .thenCompose(user -> fetchOrders(user.getId()))
    .thenCompose(orders -> CompletableFuture.allOf(
        orders.stream()
            .map(order -> processOrder(order))
            .toArray(CompletableFuture[]::new)
    ))
    .thenApply(v -> aggregateResults())
    .exceptionally(ex -> handleError(ex))
    .thenAccept(result -> sendResponse(result));
```

**This is where it gets messy.** Debugging async chains is hard. Error handling is tricky. Stack traces become useless.

**There had to be a better way...** (hint: Java 21 virtual threads solve this—more on that in another post!)

## Common Patterns and Best Practices

### Pattern 1: Producer-Consumer

Already covered with `BlockingQueue`. Perfect for decoupling producers and consumers.

### Pattern 2: Thread-Local Storage

Sometimes each thread needs its own copy of a variable:

```java
public class ThreadLocalDemo {
    // Each thread gets its own copy
    private static ThreadLocal<SimpleDateFormat> dateFormat = 
        ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));
    
    public static String formatDate(Date date) {
        // Each thread uses its own SimpleDateFormat instance
        // (SimpleDateFormat is not thread-safe!)
        return dateFormat.get().format(date);
    }
}
```

**Use when:**
- You have a non-thread-safe object (like `SimpleDateFormat`)
- Creating the object is expensive
- You don't want to synchronize access

**Warning**: Be careful with thread pools—`ThreadLocal` persists across task executions!

### Pattern 3: Immutability for Thread Safety

The easiest way to make something thread-safe? **Make it immutable.**

```java
// Immutable class - inherently thread-safe
public final class ImmutableUser {
    private final String name;
    private final int age;
    private final List<String> roles;
    
    public ImmutableUser(String name, int age, List<String> roles) {
        this.name = name;
        this.age = age;
        // Defensive copy
        this.roles = Collections.unmodifiableList(new ArrayList<>(roles));
    }
    
    public String getName() { return name; }
    public int getAge() { return age; }
    public List<String> getRoles() { return roles; }
    
    // No setters - immutable!
}
```

**Benefits:**
- No synchronization needed
- Can be shared freely between threads
- Simpler to reason about

### Pattern 4: Avoid Shared Mutable State

The best concurrency bug is the one you don't have:

```java
// BAD - shared mutable state
public class Counter {
    private int count = 0;  // Shared!
    
    public void increment() {
        count++;  // Multiple threads = problems
    }
}

// GOOD - no shared state
public class BetterCounter {
    public int increment(int current) {
        return current + 1;  // Pure function, no state
    }
}

// ALSO GOOD - use atomic variables
public class AtomicCounter {
    private AtomicInteger count = new AtomicInteger(0);
    
    public void increment() {
        count.incrementAndGet();  // Thread-safe!
    }
}
```

## Performance Considerations

Multithreading isn't always faster. Sometimes it's slower!

### Context Switching Overhead

When the CPU switches between threads, it must:
1. Save the current thread's state
2. Load the next thread's state
3. Clear CPU caches

**This takes time!** Too many threads = more time context switching than doing actual work.

### Memory Per Thread

Each thread consumes memory:
- Stack space: ~1 MB (default on most systems)
- Thread-local variables
- Bookkeeping data structures

**1,000 threads ≈ 1 GB of memory** just for stacks!

### CPU Cores vs Thread Count

**Rule of thumb:**

- **CPU-bound tasks**: Number of threads ≈ number of CPU cores
  - More threads = more context switching, no benefit
  
- **I/O-bound tasks**: Number of threads > number of CPU cores
  - Threads spend time waiting on I/O
  - More threads = better CPU utilization

```java
// For CPU-bound work
int cpuCores = Runtime.getRuntime().availableProcessors();
ExecutorService cpuBoundExecutor = Executors.newFixedThreadPool(cpuCores);

// For I/O-bound work
ExecutorService ioBoundExecutor = Executors.newFixedThreadPool(cpuCores * 2);
// Or even more, depending on I/O wait time
```

### Common Pitfalls

1. **Creating too many threads**: Use thread pools!
2. **Not shutting down executors**: Memory leaks
3. **Forgetting to handle InterruptedException**: Swallowing interrupts
4. **Overusing synchronization**: Kills performance
5. **Underusing synchronization**: Data corruption
6. **Holding locks too long**: Reduces concurrency

## Real-World Example: Concurrent Web Scraper

Let's build a complete example: scraping multiple web pages concurrently.

```java
import java.io.*;
import java.net.*;
import java.util.*;
import java.util.concurrent.*;

public class WebScraper {
    private final ExecutorService executor;
    private final int threadPoolSize;
    
    public WebScraper(int threadPoolSize) {
        this.threadPoolSize = threadPoolSize;
        this.executor = Executors.newFixedThreadPool(threadPoolSize);
    }
    
    public Map<String, String> scrapeUrls(List<String> urls) throws InterruptedException, ExecutionException {
        Map<String, String> results = new ConcurrentHashMap<>();
        List<Future<Void>> futures = new ArrayList<>();
        
        long startTime = System.currentTimeMillis();
        
        // Submit all scraping tasks
        for (String url : urls) {
            Future<Void> future = executor.submit(() -> {
                try {
                    String content = fetchUrl(url);
                    results.put(url, content);
                    System.out.println("Scraped: " + url + " on " + 
                        Thread.currentThread().getName());
                } catch (IOException e) {
                    System.err.println("Error scraping " + url + ": " + e.getMessage());
                    results.put(url, "ERROR: " + e.getMessage());
                }
                return null;
            });
            futures.add(future);
        }
        
        // Wait for all to complete
        for (Future<Void> future : futures) {
            future.get();
        }
        
        long endTime = System.currentTimeMillis();
        System.out.println("\nScraped " + urls.size() + " URLs in " + 
            (endTime - startTime) + " ms using " + threadPoolSize + " threads");
        
        return results;
    }
    
    private String fetchUrl(String urlString) throws IOException {
        URL url = new URL(urlString);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setConnectTimeout(5000);
        conn.setReadTimeout(5000);
        
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream()))) {
            StringBuilder content = new StringBuilder();
            String line;
            int lines = 0;
            
            while ((line = reader.readLine()) != null && lines < 10) {
                content.append(line).append("\n");
                lines++;
            }
            
            return content.toString();
        }
    }
    
    public void shutdown() {
        executor.shutdown();
        try {
            if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
        }
    }
    
    public static void main(String[] args) throws Exception {
        List<String> urls = Arrays.asList(
            "https://www.example.com",
            "https://www.github.com",
            "https://www.stackoverflow.com",
            "https://www.reddit.com",
            "https://www.wikipedia.org"
        );
        
        // Test with single thread
        System.out.println("=== Single Thread ===");
        WebScraper singleThread = new WebScraper(1);
        singleThread.scrapeUrls(urls);
        singleThread.shutdown();
        
        // Test with multiple threads
        System.out.println("\n=== 5 Threads ===");
        WebScraper multiThread = new WebScraper(5);
        multiThread.scrapeUrls(urls);
        multiThread.shutdown();
    }
}
```

**Expected output:**

```
=== Single Thread ===
Scraped: https://www.example.com on pool-1-thread-1
Scraped: https://www.github.com on pool-1-thread-1
Scraped: https://www.stackoverflow.com on pool-1-thread-1
Scraped: https://www.reddit.com on pool-1-thread-1
Scraped: https://www.wikipedia.org on pool-1-thread-1

Scraped 5 URLs in 3250 ms using 1 threads

=== 5 Threads ===
Scraped: https://www.example.com on pool-2-thread-1
Scraped: https://www.github.com on pool-2-thread-2
Scraped: https://www.stackoverflow.com on pool-2-thread-3
Scraped: https://www.reddit.com on pool-2-thread-4
Scraped: https://www.wikipedia.org on pool-2-thread-5

Scraped 5 URLs in 750 ms using 5 threads
```

**4x faster with 5 threads!** For I/O-bound tasks like web scraping, concurrency provides significant speedups.

## The Limitations (And What Comes Next)

We've covered a lot, but there are fundamental limitations with Java's traditional threading model:

### Problem 1: Platform Threads Are Expensive

- ~1 MB of memory per thread
- Expensive to create and destroy
- Limited by OS resources
- Typically can't have more than a few thousand

### Problem 2: Thread Pool Tuning Is Hard

How many threads should you use? It depends on:
- Number of CPU cores
- Type of work (CPU-bound vs I/O-bound)
- Average task duration
- Memory constraints
- Traffic patterns

**There's no magic number.** You tune, load test, retune, and hope for the best.

### Problem 3: Complexity

Look at the `CompletableFuture` chains we wrote. They work, but they're:
- Hard to read
- Hard to debug
- Error-prone
- Stack traces are useless

**Reactive programming** (Project Reactor, RxJava) makes this even more complex with operators like `flatMap`, `zip`, `switchMap`, etc.

### Problem 4: Blocking Operations

When a thread blocks on I/O:
- It consumes memory while doing nothing
- Can't be used for other work
- Limits scalability

**The fundamental issue**: Platform threads are a scarce resource, but we're forced to use them for tasks that mostly wait.

### What If There Was a Better Way?

Imagine if:
- Threads were so cheap you could create millions
- No need to tune thread pools
- Write simple, blocking code that scales massively
- No callback hell or reactive complexity

**This isn't fantasy. It's Java 21 with Virtual Threads.**

Java 21 introduces a revolutionary concurrency model that solves all these problems. Virtual threads are lightweight, JVM-managed threads that allow you to write simple, synchronous code while achieving massive scalability.

But that's a story for another post. **Want to learn about virtual threads and how they change everything?** Check out my deep dive: [Java 21 Concurrency Revolution: Why Your Multithreaded Code Just Got 10x Simpler](/java-21-concurrency-virtual-threads-revolution/).

## Conclusion

Concurrency in Java is powerful but complex. Let's recap the key takeaways:

**Core Concepts:**
- Threads allow multiple tasks to run simultaneously
- Each thread has its own execution path but shares memory
- Creating threads is expensive; use thread pools

**Common Problems:**
- **Race conditions**: Multiple threads accessing shared data
- **Deadlocks**: Circular dependencies on locks
- **Visibility issues**: Changes not visible across threads

**Solutions:**
- Use `synchronized` for simple locking
- Use `ReentrantLock` for advanced control
- Use concurrent collections (`ConcurrentHashMap`, etc.)
- Use thread pools (`ExecutorService`) instead of raw threads
- Prefer immutability and avoid shared mutable state

**Best Practices:**
- Synchronize only what needs synchronization
- Keep critical sections small
- Use appropriate thread pool sizes
- Always shutdown executors
- Handle `InterruptedException` properly
- Test concurrent code thoroughly

**Remember:** The easiest concurrency bug to fix is the one you don't create. Prefer simple, single-threaded solutions when possible. Add concurrency only when needed, and add it carefully.

## What's Next?

Now that you understand the fundamentals, here are your next steps:

1. **Practice**: Write concurrent programs. Make mistakes. Learn from them.
2. **Read**: Study the `java.util.concurrent` package documentation
3. **Explore**: Look into more advanced topics:
   - Fork/Join framework
   - Parallel streams
   - Atomic variables (`AtomicInteger`, etc.)
   - Phasers and barriers
4. **Advance**: Learn about Java 21's virtual threads (seriously, they're game-changing)

Got questions about Java concurrency? Run into threading issues? I'd love to hear about your experiences. Feel free to reach out on [LinkedIn](https://www.linkedin.com/in/fernando-nogueira/)!

And don't forget—when you're ready to learn how Java 21 makes all of this 10x simpler with virtual threads, check out my next post!

## References

- [Java Concurrency in Practice](https://jcip.net/) - Brian Goetz (the definitive book)
- [Oracle Java Tutorials: Concurrency](https://docs.oracle.com/javase/tutorial/essential/concurrency/)
- [java.util.concurrent package documentation](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html)
- [JEP 444: Virtual Threads](https://openjdk.org/jeps/444) - Preview of what's next!

