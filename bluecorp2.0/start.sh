#!/bin/bash
# Blue Corp 2.0 — Script de inicio local
set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║       BLUE CORP SISTEMA PREVISIONAL  ║"
echo "  ║              v2.0                    ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# ── Backend ─────────────────────────────────────────────────────────────
echo -e "${YELLOW}[1/4] Configurando backend...${NC}"

cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
  echo "  → Creando entorno virtual Python..."
  python3 -m venv venv
fi

source venv/bin/activate

echo "  → Instalando dependencias Python..."
pip install -q -r requirements.txt

echo -e "${GREEN}[2/4] Iniciando backend en http://localhost:8000${NC}"
echo "  → Documentación API: http://localhost:8000/docs"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "  → Backend PID: $BACKEND_PID"

# Esperar a que el backend arranque
sleep 3

# ── Frontend ────────────────────────────────────────────────────────────
echo -e "${YELLOW}[3/4] Configurando frontend...${NC}"

cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
  echo "  → Instalando dependencias Node.js (puede tardar unos minutos)..."
  npm install --legacy-peer-deps
fi

echo -e "${GREEN}[4/4] Iniciando frontend en http://localhost:3000${NC}"
npm start &
FRONTEND_PID=$!
echo "  → Frontend PID: $FRONTEND_PID"

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Blue Corp 2.0 iniciado correctamente!${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo "  🌐 Frontend:  http://localhost:3000"
echo "  🔌 Backend:   http://localhost:8000"
echo "  📚 API Docs:  http://localhost:8000/docs"
echo ""
echo "  Credenciales de prueba:"
echo "  ┌─────────────────────────────┐"
echo "  │ Admin:      admin / admin123│"
echo "  │ Operador:   operador1 / op123456 │"
echo "  │ Supervisor: supervisor1 / sup123456 │"
echo "  └─────────────────────────────┘"
echo ""
echo "  Presione Ctrl+C para detener todos los servicios."

# Capturar Ctrl+C para matar ambos procesos
trap "echo ''; echo 'Deteniendo servicios...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

wait $BACKEND_PID $FRONTEND_PID
