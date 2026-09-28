/**
 * PM2 production config for Vibe Music (Next.js).
 *
 * Usage on VPS:
 *   cd /var/www/vibe-music
 *   pm2 start deploy/ecosystem.config.cjs
 *   pm2 save
 *
 * Horizontal scale (opt-in):
 *   PM2_CLUSTER=1 PM2_INSTANCES=2 pm2 start deploy/ecosystem.config.cjs --only vibe
 *   Lower Prisma connection_limit per instance when clustering (e.g. 5 × instances).
 *
 * Background jobs (requires REDIS_URL — Upstash Redis protocol URL):
 *   pm2 start deploy/ecosystem.config.cjs --only vibe-worker
 */
const clusterMode = process.env.PM2_CLUSTER === "1";
const instanceCount = process.env.PM2_INSTANCES || "max";

const webApp = clusterMode
  ? {
      name: "vibe",
      cwd: __dirname + "/..",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: instanceCount,
      exec_mode: "cluster",
      autorestart: true,
      max_restarts: 20,
      min_uptime: "10s",
      max_memory_restart: "1G",
      kill_timeout: 30_000,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "127.0.0.1",
      },
      error_file: "/var/log/vibe/pm2-error.log",
      out_file: "/var/log/vibe/pm2-out.log",
      merge_logs: true,
      time: true,
    }
  : {
      name: "vibe",
      cwd: __dirname + "/..",
      script: "npm",
      args: "start",
      interpreter: "none",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 20,
      min_uptime: "10s",
      max_memory_restart: "1G",
      kill_timeout: 30_000,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "127.0.0.1",
      },
      error_file: "/var/log/vibe/pm2-error.log",
      out_file: "/var/log/vibe/pm2-out.log",
      merge_logs: true,
      time: true,
    };

const workerApp = {
  name: "vibe-worker",
  cwd: __dirname + "/..",
  script: "scripts/workers/job-worker.mts",
  interpreter: "npx",
  interpreter_args: "tsx",
  instances: 1,
  exec_mode: "fork",
  autorestart: true,
  max_restarts: 20,
  min_uptime: "10s",
  max_memory_restart: "512M",
  kill_timeout: 30_000,
  env: {
    NODE_ENV: "production",
  },
  error_file: "/var/log/vibe/pm2-worker-error.log",
  out_file: "/var/log/vibe/pm2-worker-out.log",
  merge_logs: true,
  time: true,
};

module.exports = {
  apps: [webApp, workerApp],
};
