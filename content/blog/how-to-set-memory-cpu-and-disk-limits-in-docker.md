---
title: "How to Set Memory, CPU and Disk Limits in Docker"
date: "2025-08-30"
description: "Learn how to effectively manage Docker container resources by setting memory, CPU, and disk limits using both docker run commands and Docker Compose configurations."
---

Resource management is crucial when working with Docker containers in production environments. Without proper limits, containers can consume excessive resources and potentially cause system instability. In this tutorial, I'll show you how to set memory, CPU, and disk limits for Docker containers using both the `docker run` command and Docker Compose configurations.

## Setting Resource Limits with Docker Run

The simplest way to set resource limits is directly with the `docker run` command. This approach applies limits to a specific container execution.

### Memory Limits

**To constrain memory, use the `-m` or `--memory` parameter:**

```bash
$ docker run -m 512m nginx
```

This limits the container to use a maximum of 512 megabytes of memory.

You can also set a soft limit called a reservation, which is activated when Docker detects low memory on the host machine:

```bash
$ docker run -m 512m --memory-reservation=256m nginx
```

**In addition to setting the memory limit, you can define the amount of swap memory available to the container**. To do this, set the `--memory-swap` parameter to a value greater than the `--memory` limit:

```bash
$ docker run -m 512m --memory-swap 1g nginx
```

If this parameter is set to 0, the swap configuration is ignored. However, if set to -1, the container can use unlimited swap memory up to the host's available capacity.

### CPU Limits

By default, containers have unlimited access to the computing power of the host machine.

**You can set the CPU limit using the `--cpus` parameter:**

```bash
$ docker run --cpus=2 nginx
```

This constrains the container to use at most two CPUs.

You can also specify the priority of CPU allocation using CPU shares. The default is 1024, and higher numbers indicate higher priority:

```bash
$ docker run --cpus=2 --cpu-shares=2000 nginx
```

**Another useful setting is to specify which CPUs or cores the container will have access to:**

```bash
$ docker run --cpus=.5 --cpuset-cpus=1 nginx
```

In this case, the container can use up to 50% of CPU 1. If the host has multiple CPUs, you can specify a range like `0-2` for the first three CPUs, or a list like `0,2` for specific CPUs only.

### Disk Limits

Controlling disk usage is crucial to prevent containers from consuming excessive disk space. **To set disk limits, you need to configure the storage driver with specific options**.

For containers using the overlay storage driver with XFS filesystem, you can limit the writable layer size:

```bash
$ docker run --storage-opt size=1G nginx
```

This limits the container's writable layer to 1GB.

**For more comprehensive disk management, you can configure the Docker daemon** by editing `/etc/docker/daemon.json`:

```json
{
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.size=10G"
  ]
}
```

This configuration restricts all containers to 10GB of disk space by default.

## Docker Compose Configuration

For multi-container applications, Docker Compose provides better organization and resource management.

**Create `deploy` and `resources` segments in your service configuration:**

```yaml
version: '3.8'
services:
  web:
    image: nginx
    deploy:
      resources:
        limits:
          cpus: '0.50'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M
    ports:
      - "80:80"
    volumes:
      - web_data:/var/www/html
    # For disk limits with storage options
    storage_opt:
      size: 1G

volumes:
  web_data:
    driver: local
    driver_opts:
      type: none
      o: bind,size=2G
      device: /host/path/web_data
```

In this configuration, the service is limited to half a CPU and 512MB of memory, with reservations of a quarter CPU and 128MB memory. The container's writable layer is limited to 1GB, and the volume is constrained to 2GB.

**Volume configuration breakdown:**
- `driver: local` - Uses the local volume driver
- `type: none` - Creates a bind mount (not a managed volume)
- `o: bind,size=2G` - Mount options: bind mount with 2GB size limit
- `device: /host/path/web_data` - Host directory to bind mount

**To use the deploy segment in a Docker Compose file, you need to use the docker stack command:**

```bash
$ docker stack deploy --compose-file docker-compose.yml my_stack
```

## Verification and Monitoring

After setting limits, you can verify them using several methods.

**The `docker stats` command provides real-time resource usage statistics:**

```bash
$ docker stats
CONTAINER ID   NAME                    CPU %   MEM USAGE / LIMIT   MEM %   NET I/O     BLOCK I/O   PIDS
8ad2f2c17078   my_container           0.00%   2.578MiB / 512MiB   0.50%   936B / 0B   0B / 0B     2
```

You can also use the `docker inspect` command with `grep` to filter specific configuration information:

```bash
$ docker inspect my_container | grep MemorySwap
"MemorySwap": 1073741824,
"MemorySwappiness": null,
```

For disk usage verification with storage options:

```bash
$ docker run -it --storage-opt size=1G alpine:latest df -h | grep overlay
overlay     1.0G    8.0K    1.0G   1% /
```

### Monitoring Docker Compose Volume Usage

For Docker Compose deployments, you can monitor volume usage with these commands:

```bash
# Check volume usage for all volumes
$ docker system df -v

# Inspect specific volume details
$ docker volume inspect myapp_db_data

# Monitor disk usage of running compose services
$ docker-compose exec app df -h

# Check storage driver information for compose services
$ docker-compose ps -q | xargs docker inspect --format='{{ .Name }}: {{ .HostConfig.StorageOpt }}'
```

## Best Practices

When implementing resource limits, consider these best practices:

- **Analyze workload requirements**: Understand your application's resource needs before setting limits
- **Monitor container performance**: Regularly check performance metrics to adjust limits as needed
- **Use reservations for critical services**: Ensure important containers get minimum required resources
- **Implement disk quotas**: Prevent runaway processes from filling up disk space
- **Set up log rotation**: Configure log limits to prevent log files from consuming excessive disk space

## Conclusion

In this article, we explored comprehensive ways of limiting Docker's access to host resources, including memory, CPU, and disk space. We covered usage with both the `docker run` command and Docker Compose configurations, and demonstrated how to verify resource consumption using `docker stats` and `docker inspect`.

Effective resource management is essential for maintaining stable, efficient containerized environments, especially when running multiple containers on shared infrastructure. These techniques will help you prevent resource contention and ensure your applications run smoothly in production.

## References

- [Docker Official Documentation - Runtime options with Memory, CPUs, and GPUs](https://docs.docker.com/config/containers/resource_constraints/)

- [Docker Official Documentation - Resource constraints](https://docs.docker.com/engine/containers/resource_constraints/)

---

**Having trouble with Docker on macOS?** If you're encountering the "com.docker.socket contains malware" error, check out my guide on [fixing Docker's false malware alarm](/docker-socket-was-not-opened-because-it-contains-malware/) for step-by-step solutions.