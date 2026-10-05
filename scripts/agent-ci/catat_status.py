#!/usr/bin/env python3
"""Catat status satu agent ke ci-agents/status.json (dipanggil workflow agent.yml).

Pakai: python3 catat_status.py <berkas-tugas> <status> <run-url>
status: selesai | gagal
"""
import json
import subprocess
import sys
import time

berkas, status, run_url = sys.argv[1], sys.argv[2], sys.argv[3]
with open(berkas, encoding="utf-8") as f:
    tugas = json.load(f)

try:
    with open("ci-agents/status.json", encoding="utf-8") as f:
        status_map = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    status_map = {}

status_map[tugas["id"]] = {
    "status": status,
    "waktu": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "judul": tugas["judul"],
    "run": run_url,
}
urutan = dict(sorted(status_map.items(), key=lambda kv: (kv[1].get("waktu", ""), kv[0])))
with open("ci-agents/status.json", "w", encoding="utf-8") as f:
    json.dump(urutan, f, ensure_ascii=False, indent=2)
    f.write("\n")

print(f"status {tugas['id']} = {status}")
