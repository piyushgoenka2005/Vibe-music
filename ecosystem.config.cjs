module.exports = {
  apps: [
    {
      name: "vibe",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: ".",
      // Cluster mode: one process per CPU core.  At 2K concurrent users
      // with ~20 DB connections each, a 4-core VPS gets 80 total connections.
      instances: "max",
      exec_mode: "cluster",
      // Graceful restart on high memory usage
      max_memory_restart: "800M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Restart settings
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      // Logging
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      merge_logs: true,
    },
  ],
};
