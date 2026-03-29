#!/usr/bin/env bash
set -euo pipefail

TMP_DIR="${TMPDIR:-/tmp}/portpourri-harness"
mkdir -p "$TMP_DIR"

cat > "$TMP_DIR/node-server.js" <<'EOF'
const net = require("net");
const ports = [3000, 5173, 8081];
for (const port of ports) {
  net.createServer(() => {}).listen(port, "127.0.0.1", () => {
    console.log(`node:${port}`);
  });
}
setInterval(() => {}, 1000);
EOF

cat > "$TMP_DIR/python-server.py" <<'EOF'
import http.server
import socketserver

PORT = 5433
with socketserver.TCPServer(("127.0.0.1", PORT), http.server.SimpleHTTPRequestHandler) as httpd:
    print(f"python:{PORT}")
    httpd.serve_forever()
EOF

node "$TMP_DIR/node-server.js" &
NODE_PID=$!
python3 "$TMP_DIR/python-server.py" &
PY_PID=$!

echo "Node PID: $NODE_PID"
echo "Python PID: $PY_PID"
echo "Press Ctrl+C to stop."

cleanup() {
  kill "$NODE_PID" "$PY_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM
wait
