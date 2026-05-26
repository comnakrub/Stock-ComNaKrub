#!/usr/bin/env bash
set -euo pipefail

# ── Colors ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${GREEN}[✓]${NC} $*"; }
step()  { echo -e "${CYAN}[→]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[✗]${NC} $*" >&2; exit 1; }

# ── Load .env ────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

[[ -f .env ]] || error ".env not found — copy .env.example and fill in values"
set -a; source .env; set +a

# ── Config ────────────────────────────────────────────────────────────────────
NAS_HOST="${NAS_HOST:-192.168.99.105}"
NAS_USER="${NAS_USER:-na}"
NAS_PORT="${PORT:-3000}"

NAS_APP_DIR="/share/homes/na/stock-comnakrub"   # source + build context (owned by na)
NAS_DATA_DIR="/share/homes/na/stock-data"
NAS_COMPOSE="/share/homes/na/docker-compose.qnap.yml"
DOCKER="/share/CACHEDEV1_DATA/.qpkg/container-station/usr/bin/.libs/docker"

# ─────────────────────────────────────────────────────────────────────────────
# Step 1 — Copy SSH key if needed
# ─────────────────────────────────────────────────────────────────────────────
setup_ssh() {
    step "Checking SSH key on $NAS_HOST..."
    if ssh -o BatchMode=yes -o ConnectTimeout=5 "$NAS_USER@$NAS_HOST" true 2>/dev/null; then
        info "SSH key already configured"
    else
        warn "No passwordless SSH yet — running ssh-copy-id (enter NAS password once)"
        ssh-copy-id "$NAS_USER@$NAS_HOST"
        info "SSH key copied"
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# Step 2 — Sync files to NAS (source + build context combined)
# ─────────────────────────────────────────────────────────────────────────────
sync_files() {
    step "Syncing files → $NAS_HOST:$NAS_APP_DIR ..."
    ssh "$NAS_USER@$NAS_HOST" "mkdir -p '$NAS_APP_DIR' '$NAS_DATA_DIR'"
    rsync -az --delete \
        --exclude='.git/' \
        --exclude='.claude/' \
        --exclude='.superpowers/' \
        --exclude='node_modules/' \
        --exclude='data/' \
        --exclude='.env' \
        --exclude='*.db' \
        --exclude='deploy.sh' \
        . "$NAS_USER@$NAS_HOST:$NAS_APP_DIR/"
    info "Files synced"
}

# ─────────────────────────────────────────────────────────────────────────────
# Step 3 — Build Docker image on NAS (avoids Mac→NAS cross-platform issues)
# ─────────────────────────────────────────────────────────────────────────────
build_image() {
    step "Building Docker image on NAS..."
    ssh "$NAS_USER@$NAS_HOST" "$DOCKER build -t stock-comnakrub '$NAS_APP_DIR'"
    info "Image built"
}

# ─────────────────────────────────────────────────────────────────────────────
# Step 4 — Restart container with live mounts
# ─────────────────────────────────────────────────────────────────────────────
deploy() {
    step "Starting container..."
    ssh "$NAS_USER@$NAS_HOST" "
        $DOCKER compose -f '$NAS_COMPOSE' up --force-recreate -d
        echo ''
        $DOCKER compose -f '$NAS_COMPOSE' ps
    "
    info "Deployment complete!"
    echo -e "\n  ${CYAN}App running at:${NC} http://$NAS_HOST:$NAS_PORT\n"
}

# ── Main ──────────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}=== Stock-ComNaKrub Deploy ===${NC}\n"
setup_ssh
sync_files
build_image
deploy
