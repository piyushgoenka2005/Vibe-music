#!/bin/bash
# ─── VPS Tuning for 2K+ Concurrent Real-Time Users ───────────────────────
#
# Run this ONCE on the production VPS to optimize the kernel for high
# concurrency. Requires root access.
#
# What this tunes:
#   1. File descriptors: 2K concurrent × ~10 FDs each = 20K minimum
#   2. TCP buffers: prevent socket exhaustion under burst traffic
#   3. Connection tracking: prevent conntrack table overflow
#   4. TCP keepalive: detect dead connections faster
#   5. PM2 limits: increase nofile for Node.js workers
#
# Usage:
#   sudo bash deploy/vps-tuning.sh
#
# Safe to run multiple times (idempotent).
# ──────────────────────────────────────────────────────────────────────────

set -euo pipefail

echo "🔧 Vibe Music — VPS Tuning for 2K Concurrent Users"
echo "=================================================="

# ─── 1. File Descriptors ──────────────────────────────────────────────────
echo ""
echo "📁 Setting file descriptor limits..."

# System-wide: 65536 open files (2K users × ~10 FDs each + headroom)
if ! grep -q "fs.file-max = 65536" /etc/sysctl.conf 2>/dev/null; then
    echo "fs.file-max = 65536" >> /etc/sysctl.conf
    echo "  ✓ Set fs.file-max = 65536"
else
    echo "  ✓ fs.file-max already set"
fi

# Per-process limits for PM2/Node.js workers
LIMITS_CONF="/etc/security/limits.conf"
for user in root www-data node; do
    if ! grep -q "$user.*nofile.*65536" "$LIMITS_CONF" 2>/dev/null; then
        echo "$user soft nofile 65536" >> "$LIMITS_CONF"
        echo "$user hard nofile 65536" >> "$LIMITS_CONF"
        echo "  ✓ Set nofile limits for $user"
    fi
done

# PM2 systemd service override (if using systemd)
PM2_SERVICE="/etc/systemd/system/pm2-root.service.d/override.conf"
if [ ! -f "$PM2_SERVICE" ]; then
    mkdir -p /etc/systemd/system/pm2-root.service.d/ 2>/dev/null || true
    cat > "$PM2_SERVICE" << 'EOF'
[Service]
LimitNOFILE=65536
LimitNPROC=65536
EOF
    systemctl daemon-reload 2>/dev/null || true
    echo "  ✓ Created PM2 systemd override with nofile=65536"
fi

# ─── 2. TCP Buffers ────────────────────────────────────────────────────────
echo ""
echo "🌐 Tuning TCP stack..."

SYSCTL_TUNES=(
    # TCP receive/send buffer sizes (min/default/max in bytes)
    # 4KB min, 64KB default, 4MB max — handles burst traffic
    "net.core.rmem_default=65536"
    "net.core.wmem_default=65536"
    "net.core.rmem_max=4194304"
    "net.core.wmem_max=4194304"

    # TCP memory (min/pressure/max in pages, 1 page = 4KB)
    # 4MB min, 6MB pressure, 16MB max per socket
    "net.ipv4.tcp_rmem=4096 65536 4194304"
    "net.ipv4.tcp_wmem=4096 65536 4194304"

    # Connection backlog: accept 8192 pending connections
    "net.core.somaxconn=8192"
    "net.core.netdev_max_backlog=8192"

    # TCP fast open: reduce latency for repeat connections
    "net.ipv4.tcp_fastopen=3"

    # TCP keepalive: detect dead connections in 60s instead of 2h
    "net.ipv4.tcp_keepalive_time=60"
    "net.ipv4.tcp_keepalive_intvl=10"
    "net.ipv4.tcp_keepalive_probes=6"

    # TIME_WAIT: allow rapid socket reuse
    "net.ipv4.tcp_tw_reuse=1"
    "net.ipv4.tcp_fin_timeout=15"

    # Increase local port range for outgoing connections
    "net.ipv4.ip_local_port_range=1024 65535"

    # Enable TCP window scaling for high throughput
    "net.ipv4.tcp_window_scaling=1"

    # Disable slow start after idle (helps with keepalive connections)
    "net.ipv4.tcp_slow_start_after_idle=0"
)

for tune in "${SYSCTL_TUNES[@]}"; do
    key="${tune%%=*}"
    value="${tune#*=}"
    if ! grep -q "^$key" /etc/sysctl.conf 2>/dev/null; then
        echo "$key = $value" >> /etc/sysctl.conf
    fi
done
echo "  ✓ TCP parameters written to /etc/sysctl.conf"

# ─── 3. Connection Tracking ────────────────────────────────────────────────
echo ""
echo "🔗 Tuning connection tracking..."

# Increase conntrack table for 2K concurrent connections
# Each connection uses ~1 conntrack entry, 2K × 4 (SYN, ESTABLISHED, etc.) = 8K
# Set to 65536 for headroom
if ! grep -q "net.netfilter.nf_conntrack_max" /etc/sysctl.conf 2>/dev/null; then
    cat >> /etc/sysctl.conf << 'EOF'
# Connection tracking for high concurrency
net.netfilter.nf_conntrack_max=65536
net.netfilter.nf_conntrack_tcp_timeout_established=3600
net.netfilter.nf_conntrack_tcp_timeout_time_wait=30
net.netfilter.nf_conntrack_tcp_timeout_close_wait=15
net.netfilter.nf_conntrack_tcp_timeout_fin_wait=30
EOF
    echo "  ✓ Conntrack parameters set"
else
    echo "  ✓ Conntrack already configured"
fi

# ─── 4. Apply sysctl ───────────────────────────────────────────────────────
echo ""
echo "⚡ Applying kernel parameters..."
sysctl -p 2>/dev/null || echo "  ⚠ Some parameters may require a reboot"
echo "  ✓ Applied"

# ─── 5. PM2 defaults ───────────────────────────────────────────────────────
echo ""
echo "📦 Setting PM2 defaults..."
pm2 startup 2>/dev/null || true
echo "  ✓ PM2 startup configured"

# ─── 6. Nginx cache directory ──────────────────────────────────────────────
echo ""
echo "📂 Creating Nginx cache directory..."
mkdir -p /var/cache/nginx/vibe-pages
chown www-data:www-data /var/cache/nginx/vibe-pages 2>/dev/null || true
chmod 700 /var/cache/nginx/vibe-pages
echo "  ✓ /var/cache/nginx/vibe-pages created"

# ─── 7. Log rotation for PM2 ───────────────────────────────────────────────
echo ""
echo "📋 Setting up log rotation..."
cat > /etc/logrotate.d/pm2 << 'EOF'
/home/*/.pm2/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF
echo "  ✓ PM2 log rotation configured"

# ─── Summary ───────────────────────────────────────────────────────────────
echo ""
echo "✅ VPS tuning complete!"
echo ""
echo "Applied optimizations:"
echo "  • File descriptors: 65536 (supports 2K+ concurrent)"
echo "  • TCP buffers: 64KB-4MB (handles burst traffic)"
echo "  • TCP keepalive: 60s (fast dead connection detection)"
echo "  • Connection backlog: 8192 (absorbs traffic spikes)"
echo "  • Conntrack: 65536 entries (prevents table overflow)"
echo "  • PM2 nofile: 65536 (enables 2K connections per worker)"
echo "  • Nginx cache dir: /var/cache/nginx/vibe-pages"
echo ""
echo "Next steps:"
echo "  1. sudo cp deploy/nginx/vibemusic.in.conf /etc/nginx/sites-available/vibemusic.in.conf"
echo "  2. sudo nginx -t && sudo systemctl reload nginx"
echo "  3. pm2 restart ecosystem.config.cjs"
echo ""
echo "⚠ Some kernel changes may require a reboot to take full effect."
echo "  Schedule: sudo shutdown -r +10 'Reboot for network tuning'"
