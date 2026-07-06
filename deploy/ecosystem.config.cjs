/**
 * PM2 production config for Vibe Music (Next.js).
 * Usage on VPS:
 *   cd /var/www/vibe-music   # or your app path
 *   pm2 start deploy/ecosystem.config.cjs
 *   pm2 save
 */
module.exports = {
  apps: [
    {
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
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "127.0.0.1",
      },
      // Next.js loads .env.production automatically when NODE_ENV=production
      error_file: "/var/log/vibe/pm2-error.log",
      out_file: "/var/log/vibe/pm2-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
