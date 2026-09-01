#!/bin/bash
# ─── Vibe Music — Monitoring Stack Setup ──────────────────────────────────
# One-command setup for the VPS. Installs Docker, deploys Prometheus/Grafana/
# Uptime Kuma, and configures Nginx reverse proxy for secure access.
#
# Usage:
#   bash deploy/monitoring/setup.sh
#
# After setup:
#   Grafana:     https://vibemusic.in/grafana  (admin / vibe-admin-2024)
#   Uptime Kuma: https://vibemusic.in/uptime   (create admin on first visit)
#   Prometheus:  http://localhost:9090          (internal only)
# ──────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITORING_DIR="$SCRIPT_DIR"

echo "═══════════════════════════════════════════════════════════════"
echo "  Vibe Music — Monitoring Stack Setup"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ── 1. Check for Docker ──
if ! command -v docker &>/dev/null; then
  echo "📦 Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER"
  echo "✅ Docker installed. You may need to log out and back in for group changes."
  echo "   Continuing with current session..."
else
  echo "✅ Docker already installed: $(docker --version)"
fi

# ── 2. Check for Docker Compose ──
if ! docker compose version &>/dev/null; then
  echo "📦 Installing Docker Compose plugin..."
  sudo apt-get update -qq && sudo apt-get install -y -qq docker-compose-plugin
else
  echo "✅ Docker Compose already installed: $(docker compose version)"
fi

# ── 3. Create monitoring directory if needed ──
echo ""
echo "📁 Setting up monitoring configs..."
mkdir -p /opt/vibe-monitoring
cp -r "$MONITORING_DIR"/* /opt/vibe-monitoring/
cd /opt/vibe-monitoring

# ── 4. Update Prometheus config to use correct target ──
# The app runs on localhost:3000, Docker uses host.docker.internal for host access.
# On Linux, we need to use the host's actual IP or 172.17.0.1 (Docker bridge).
HOST_IP=$(ip -4 addr show docker0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}' || echo "172.17.0.1")

cat > prometheus.yml << PROM_EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert-rules.yml"

scrape_configs:
  - job_name: "vibe-app"
    metrics_path: "/api/metrics"
    scheme: "http"
    static_configs:
      - targets: ["${HOST_IP}:3000"]
        labels:
          service: "vibe-nextjs"
          environment: "production"
    scrape_timeout: 5s

  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]
PROM_EOF

echo "✅ Prometheus configured to scrape ${HOST_IP}:3000"

# ── 5. Deploy the stack ──
echo ""
echo "🚀 Starting monitoring stack..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# ── 6. Verify services ──
echo ""
echo "🔍 Verifying services..."

# Check Prometheus
if curl -sf http://localhost:9090/-/healthy >/dev/null 2>&1; then
  echo "  ✅ Prometheus: http://localhost:9090"
else
  echo "  ❌ Prometheus failed to start. Check: docker logs vibe-prometheus"
fi

# Check Grafana
if curl -sf http://localhost:3001/api/health >/dev/null 2>&1; then
  echo "  ✅ Grafana:    http://localhost:3001 (admin / vibe-admin-2024)"
else
  echo "  ❌ Grafana failed to start. Check: docker logs vibe-grafana"
fi

# Check Uptime Kuma
if curl -sf http://localhost:3002 >/dev/null 2>&1; then
  echo "  ✅ Uptime Kuma: http://localhost:3002"
else
  echo "  ⏳ Uptime Kuma starting... (first boot takes ~30s)"
fi

# ── 7. Configure Nginx reverse proxy ──
echo ""
echo "🌐 Configuring Nginx reverse proxy for Grafana and Uptime Kuma..."

NGINX_CONF="/etc/nginx/sites-available/vibemusic-monitoring.conf"
sudo tee "$NGINX_CONF" > /dev/null << 'NGINX_EOF'
# Monitoring stack reverse proxy — served under /grafana and /uptime
# Access: https://vibemusic.in/grafana  (Grafana)
#         https://vibemusic.in/uptime   (Uptime Kuma)

# ── Grafana ──
location /grafana/ {
    proxy_pass http://127.0.0.1:3001/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # WebSocket support (Grafana Live)
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    proxy_read_timeout 60s;
    proxy_send_timeout 60s;
}

# ── Uptime Kuma ──
location /uptime/ {
    proxy_pass http://127.0.0.1:3002/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # WebSocket support (Uptime Kuma uses Socket.IO)
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    proxy_read_timeout 60s;
    proxy_send_timeout 60s;
}
NGINX_EOF

# Check if the monitoring location block is already in the main config
if ! grep -q "location /grafana/" /etc/nginx/sites-available/vibemusic.in.conf 2>/dev/null; then
  echo ""
  echo "  ℹ️  To enable web access, add this to your main Nginx server block:"
  echo "     Include: include /etc/nginx/sites-available/vibemusic-monitoring.conf;"
  echo ""
  echo "  Or add these locations directly to /etc/nginx/sites-available/vibemusic.in.conf"
  echo "  inside the HTTPS server { } block, then:"
  echo "     sudo nginx -t && sudo systemctl reload nginx"
else
  echo "  ✅ Nginx locations already configured"
fi

# ── 8. Create systemd service for auto-start ──
echo ""
echo "🔄 Creating systemd service for auto-start on boot..."

sudo tee /etc/systemd/system/vibe-monitoring.service > /dev/null << SYSTEMD_EOF
[Unit]
Description=Vibe Music Monitoring Stack (Prometheus + Grafana + Uptime Kuma)
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/vibe-monitoring
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=120

[Install]
WantedBy=multi-user.target
SYSTEMD_EOF

sudo systemctl daemon-reload
sudo systemctl enable vibe-monitoring.service
echo "  ✅ Systemd service enabled (auto-starts on boot)"

# ── 9. Setup log rotation ──
echo ""
echo "📋 Setting up log rotation..."
sudo tee /etc/logrotate.d/vibe-monitoring > /dev/null << LOGROTATE_EOF
/var/lib/docker/volumes/vibe-uptime-kuma_data/_data/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
LOGROTATE_EOF
echo "  ✅ Log rotation configured"

# ── 10. Summary ──
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ Monitoring Stack Deployed Successfully!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Services:"
echo "    Prometheus:  http://localhost:9090  (internal only)"
echo "    Grafana:     http://localhost:3001  (admin / vibe-admin-2024)"
echo "    Uptime Kuma: http://localhost:3002  (create admin on first visit)"
echo ""
echo "  For external access, add Nginx locations and reload:"
echo "    sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "  Then access:"
echo "    Grafana:     https://vibemusic.in/grafana"
echo "    Uptime Kuma: https://vibemusic.in/uptime"
echo ""
echo "  Management:"
echo "    cd /opt/vibe-monitoring"
echo "    docker compose logs -f          # watch logs"
echo "    docker compose restart           # restart all"
echo "    docker compose down              # stop all"
echo ""
echo "  ⚠️  IMPORTANT: Change the default Grafana password after first login!"
echo "═══════════════════════════════════════════════════════════════"
