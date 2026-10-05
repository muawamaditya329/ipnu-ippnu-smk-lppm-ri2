#!/usr/bin/env bash
# Gerbang kualitas CI agent: check → build produksi → smoke test server hasil build.
# Dipakai workflow agent.yml; keluar 0 bila semua lolos.
set -uo pipefail
cd "$(dirname "$0")/../.."

echo "[gerbang] svelte-check…"
npm run check || exit 3

echo "[gerbang] build produksi…"
ORIGIN=http://localhost:3000 npm run build || exit 4

echo "[gerbang] smoke test…"
ORIGIN=http://localhost:3000 PORT=3000 node build/index.js &
SRV=$!
siap=0
for i in $(seq 1 30); do
  if curl -sf http://localhost:3000/ >/dev/null 2>&1; then siap=1; break; fi
  sleep 1
done
if [ "$siap" != "1" ]; then
  echo "::error::Server tidak siap dalam 30 detik"
  kill $SRV 2>/dev/null || true
  exit 5
fi
gagal=0
for path in / /berita /agenda /galeri /dokumen /daftar /masuk /tentang; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3000$path")
  echo "  $path -> $code"
  if [ "$code" != "200" ]; then
    echo "::error::Halaman $path mengembalikan $code (diharapkan 200)"
    gagal=1
  fi
done
code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/halaman-tidak-ada)
echo "  /halaman-tidak-ada -> $code (diharapkan 404)"
if [ "$code" != "404" ]; then
  echo "::error::Rute tak dikenal seharusnya 404, didapat $code"
  gagal=1
fi
kill $SRV 2>/dev/null || true
exit $gagal
