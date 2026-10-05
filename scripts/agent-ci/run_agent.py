#!/usr/bin/env python3
"""Agent CI — menjalankan SATU tugas agent (model GLM) di dalam GitHub Actions.

Alur:
  1. Baca berkas tugas (JSON di ci-agents/): id, judul, prompt, browser.
  2. Loop alat: model GLM menerima akses run_bash / read_file / write_file /
     edit_file / finish untuk mengerjakan tugasnya langsung di salinan repo.
  3. Setelah finish: gerbang kualitas — npm run check → build → smoke test,
     dengan putaran perbaikan otomatis (galat gerbang dikirim balik ke model).
  4. Tulis laporan ke /tmp/agent-report.md dan keluar 0 bila semua lolos.

Dipanggil oleh workflow .github/workflows/agent.yml. Kunci API dari env
GLM_API_KEY. Hanya stdlib Python — tanpa dependensi tambahan.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request

API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
MODEL = os.environ.get("MODEL_AGENT", "glm-5.3-flash")
REPO = os.getcwd()
BATAS_PUTARAN = int(os.environ.get("BATAS_PUTARAN", "80"))
BATAS_BASH = 240  # detik per perintah
POTONG = 9000  # potongan maksimal keluaran alat (karakter)

ALAT = [
    {
        "type": "function",
        "function": {
            "name": "run_bash",
            "description": "Jalankan perintah shell di akar repo. Gunakan untuk npm, git diff/status, memulai dev server (background: 'npm run dev -- --port 3462 > /tmp/dev.log 2>&1 &'), dan uji browser.",
            "parameters": {
                "type": "object",
                "properties": {
                    "perintah": {"type": "string", "description": "Perintah shell (bash)"},
                },
                "required": ["perintah"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Baca isi berkas (teks). Baris diberi nomor.",
            "parameters": {
                "type": "object",
                "properties": {
                    "berkas": {"type": "string", "description": "Path relatif dari akar repo"},
                    "mulai": {"type": "integer", "description": "Baris awal (opsional, 1-based)"},
                    "sampai": {"type": "integer", "description": "Baris akhir inklusif (opsional)"},
                },
                "required": ["berkas"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Tulis/transformasi seluruh isi berkas (menimpa). Untuk berkas baru atau penulisan ulang menyeluruh.",
            "parameters": {
                "type": "object",
                "properties": {
                    "berkas": {"type": "string"},
                    "isi": {"type": "string"},
                },
                "required": ["berkas", "isi"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "edit_file",
            "description": "Ganti potongan teks tepat di dalam berkas (lebih disukai daripada menulis ulang). old_str harus muncul tepat sekali.",
            "parameters": {
                "type": "object",
                "properties": {
                    "berkas": {"type": "string"},
                    "old_str": {"type": "string"},
                    "new_str": {"type": "string"},
                },
                "required": ["berkas", "old_str", "new_str"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "finish",
            "description": "Akhiri pekerjaan dan serahkan laporan. WAJIB dipanggil setelah tugas selesai.",
            "parameters": {
                "type": "object",
                "properties": {
                    "selesai": {"type": "boolean", "description": "true bila tugas benar-benar tuntas"},
                    "ringkasan": {"type": "string", "description": "Apa yang dikerjakan/ditemukan/diperbaiki"},
                    "berkas_diubah": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["selesai", "ringkasan"],
            },
        },
    },
]

SISTEM = """Anda adalah AGENT PENGERJA tugas perangkat lunak yang berjalan di GitHub Actions runner, \
pada salinan lengkap repo "Website Komisariat IPNU & IPPNU SMK LPPM RI 2 Kedungreja" \
(SvelteKit 3 + Svelte 5 runes + TypeScript + Tailwind v4 + better-sqlite3 + adapter-node). \
Anda bekerja dengan bahasa Indonesia untuk seluruh teks UI, pesan, dan laporan.

CARA KERJA (taat, tanpa kecuali):
1. BACA dulu `CLAUDE.md` (konvensi proyek) dan bila tugas menyangkut tampilan juga `DESIGN.md` \
(arah desain yang mengikat), memakai alat read_file. Jangan menabrak konvensinya.
2. Kerjakan tugas dengan alat yang tersedia: run_bash, read_file, write_file, edit_file. \
Utamakan edit_file (ganti potongan) daripada menulis ulang seluruh berkas.
3. Uji perubahan Anda: `npm run check` harus 0 error/0 warning sebelum finish. \
Untuk tugas peramban: jalankan dev server (`npm run dev -- --port 3462 > /tmp/dev.log 2>&1 &` tunggu \
`curl -sf http://localhost:3462/` berhasil), lalu uji via peramban sungguhan memakai helper di \
`scripts/agent-ci/lab/` (baca berkasnya dulu untuk cara pakai; chromium sudah terpasang). \
Error konsol = bug yang harus dibereskan. Sertakan bukti (keluaran helper/screenshot di /tmp).
4. LARANGAN mutlak: `git commit`/`git push` (workflow yang melakukan), `npm run db:reset`, \
mengedit `data/`, `.github/`, `scripts/agent-ci/`, atau menambah dependensi tanpa alasan kuat \
(yang dilarang: menyentuh token/kredensial).
5. Akhiri dengan memanggil alat `finish` berisi laporan jujur. Jika tugas tidak dapat diselesaikan, \
panggil `finish` dengan selesai=false dan jelaskan hambatannya — jangan mengarang keberhasilan."""

PANDUAN_GERBANG = """Gerbang kualitas otomatis menemukan masalah berikut setelah Anda finish. \
Perbaiki dengan alat yang tersedia, lalu panggil `finish` lagi. Jangan mengabaikannya."""


def panggil_glm(pesan):
    """Satu panggilan chat-completions dengan alat; ulang otomatis bila galat sementara."""
    kunci = os.environ["GLM_API_KEY"]
    tubuh = {
        "model": MODEL,
        "messages": pesan,
        "temperature": 0.2,
        "tools": ALAT,
        "tool_choice": "auto",
        "max_tokens": 12288,
    }
    data = json.dumps(tubuh).encode()
    for i in range(5):
        req = urllib.request.Request(
            API_URL,
            data=data,
            headers={"Authorization": "Bearer " + kunci, "Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            isi = e.read().decode(errors="replace")[:600]
            if e.code == 400 and "max_tokens" in isi:
                tubuh.pop("max_tokens", None)
                data = json.dumps(tubuh).encode()
                continue
            if e.code in (429, 500, 502, 503, 504) and i < 4:
                time.sleep(15 * (i + 1))
                continue
            raise SystemExit(f"API GLM galat {e.code}: {isi}")
        except Exception as e:  # noqa: BLE001
            if i < 4:
                time.sleep(15 * (i + 1))
                continue
            raise SystemExit(f"API GLM gagal: {type(e).__name__}: {e}")


# --- Implementasi alat -------------------------------------------------------

def jalankan_bash(perintah):
    try:
        hasil = subprocess.run(
            perintah, shell=True, cwd=REPO, capture_output=True, text=True, timeout=BATAS_BASH
        )
        keluar = (hasil.stdout or "") + (("\n[stderr]\n" + hasil.stderr) if hasil.stderr else "")
        return f"[exit {hasil.returncode}]\n{keluar}"
    except subprocess.TimeoutExpired:
        return f"[timeout {BATAS_BASH}s]"


def path_aman(berkas):
    p = os.path.realpath(os.path.join(REPO, berkas))
    if not p.startswith(REPO):
        raise ValueError(f"path keluar repo: {berkas}")
    return p


def baca_berkas(berkas, mulai=None, sampai=None):
    with open(path_aman(berkas), encoding="utf-8", errors="replace") as f:
        baris = f.readlines()
    a = max(1, int(mulai or 1))
    b = min(len(baris), int(sampai or len(baris)))
    potongan = baris[a - 1 : b]
    if not potongan:
        return "(kosong / di luar rentang)"
    nomor = "".join(f"{i + a:>5}\t{ln}" for i, ln in enumerate(potongan))
    if b - a + 1 > 400:
        nomor += "\n… (terpotong 400 baris; pakai mulai/sampai untuk bagian lain)"
    return nomor


def tulis_berkas(berkas, isi):
    p = path_aman(berkas)
    os.makedirs(os.path.dirname(p) or REPO, exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(isi)
    return f"tertulis {berkas} ({len(isi)} byte)"


def edit_berkas(berkas, old_str, new_str):
    p = path_aman(berkas)
    with open(p, encoding="utf-8") as f:
        teks = f.read()
    jumlah = teks.count(old_str)
    if jumlah == 0:
        return "GAGAL: old_str tidak ditemukan — periksa kembali teks persisnya (baca berkas dulu)."
    if jumlah > 1:
        return f"GAGAL: old_str muncul {jumlah}x — perluas konteks agar unik."
    with open(p, "w", encoding="utf-8") as f:
        f.write(teks.replace(old_str, new_str, 1))
    return f"teredit {berkas}"


def potong(teks):
    teks = str(teks)
    return teks if len(teks) <= POTONG else teks[:POTONG] + f"\n…(terpotong, {len(teks)} karakter)"


# --- Gerbang kualitas --------------------------------------------------------

def gerbang(pesan, laporan):
    """check → build → smoke; galat dikirim balik ke model untuk diperbaiki."""
    tahap = [("npm run check", "svelte-check"), ("npm run build", "build produksi")]
    for perintah, nama in tahap:
        for putaran in range(3):
            hasil = subprocess.run(
                perintah, shell=True, cwd=REPO, capture_output=True, text=True, timeout=900
            )
            if hasil.returncode == 0:
                laporan.setdefault("gerbang", {})[nama] = "lolos"
                break
            keluar = potong((hasil.stdout or "") + "\n" + (hasil.stderr or ""))
            print(f"[gerbang] {nama} gagal (putaran {putaran + 1}); minta model memperbaiki…", flush=True)
            laporan.setdefault("gerbang", {})[nama] = f"gagal: {keluar[-800:]}"
            pesan.append({"role": "user", "content": PANDUAN_GERBANG + f"\n\nPerintah: `{perintah}`\n\n```\n{keluar}\n```"})
            jawab_akhir = loop_alat(pesan, batas=25)
            if jawab_akhir is None and putaran == 2:
                return False
        else:
            return False
    return smoke_test(laporan)


def smoke_test(laporan):
    os.environ["ORIGIN"] = "http://localhost:3000"
    subprocess.run("npm run build", shell=True, cwd=REPO, capture_output=True, text=True, timeout=900)
    srv = subprocess.Popen(
        ["node", "build/index.js"], cwd=REPO,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        env={**os.environ, "PORT": "3000", "ORIGIN": "http://localhost:3000"},
    )
    try:
        siap = False
        for _ in range(30):
            if subprocess.run(["curl", "-sf", "http://localhost:3000/"], capture_output=True).returncode == 0:
                siap = True
                break
            time.sleep(1)
        if not siap:
            laporan.setdefault("gerbang", {})["smoke"] = "server tidak siap 30s"
            return False
        gagal = []
        for path in ["/", "/berita", "/agenda", "/galeri", "/dokumen", "/daftar", "/masuk", "/tentang"]:
            kode = subprocess.run(
                ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", f"http://localhost:3000{path}"],
                capture_output=True, text=True,
            ).stdout
            if kode != "200":
                gagal.append(f"{path}→{kode}")
        laporan.setdefault("gerbang", {})["smoke"] = "lolos" if not gagal else f"gagal: {', '.join(gagal)}"
        return not gagal
    finally:
        srv.terminate()


# --- Loop alat ---------------------------------------------------------------

def loop_alat(pesan, batas):
    """Jalankan putaran alat sampai finish/batas; balik laporan finish atau None."""
    for _ in range(batas):
        global TUNTAS
        TUNTAS = False
        resp = panggil_glm(pesan)
        pilih = resp["choices"][0]["message"]
        pesan.append(pilih)
        seruan = pilih.get("tool_calls") or []
        if not seruan:
            pesan.append({"role": "user", "content": "Panggil alat yang diperlukan; jika tugas tuntas, panggil `finish`."})
            continue
        for s in seruan:
            nama = s["function"]["name"]
            try:
                argumen = json.loads(s["function"]["arguments"] or "{}")
            except json.JSONDecodeError:
                keluar = "GAGAL: argumen bukan JSON valid"
            else:
                if nama == "finish":
                    hasil_akhir = argumen
                    print(f"[finish] {json.dumps(argumen, ensure_ascii=False)[:400]}", flush=True)
                    return argumen
                try:
                    if nama == "run_bash":
                        keluar = jalankan_bash(argumen["perintah"])
                    elif nama == "read_file":
                        keluar = baca_berkas(argumen["berkas"], argumen.get("mulai"), argumen.get("sampai"))
                    elif nama == "write_file":
                        keluar = tulis_berkas(argumen["berkas"], argumen["isi"])
                    elif nama == "edit_file":
                        keluar = edit_berkas(argumen["berkas"], argumen["old_str"], argumen["new_str"])
                    else:
                        keluar = f"alat tak dikenal: {nama}"
                except Exception as e:  # noqa: BLE001
                    keluar = f"GAGAL {type(e).__name__}: {e}"
            print(f"[alat] {nama} → {keluar.splitlines()[0][:120] if keluar else ''}", flush=True)
            pesan.append({"role": "tool", "tool_call_id": s["id"], "content": potong(keluar)})
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tugas", required=True, help="Berkas JSON tugas (ci-agents/*.json)")
    args = ap.parse_args()

    with open(args.tugas, encoding="utf-8") as f:
        tugas = json.load(f)

    print(f"=== Agent {tugas['id']} — {tugas['judul']} ===", flush=True)
    pesan = [
        {"role": "system", "content": SISTEM},
        {"role": "user", "content": f"TUGAS ANDA (id {tugas['id']}):\n\n{tugas['prompt']}"},
    ]
    hasil = loop_alat(pesan, batas=BATAS_PUTARAN)
    laporan = {
        "id": tugas["id"],
        "judul": tugas["judul"],
        "selesai": bool(hasil and hasil.get("selesai")),
        "ringkasan": (hasil or {}).get("ringkasan", "finish tidak dipanggil sebelum batas putaran"),
        "berkas_diubah": (hasil or {}).get("berkas_diubah", []),
        "gerbang": {},
    }

    if laporan["selesai"]:
        laporan["gerbang_lolos"] = gerbang(pesan, laporan)
    else:
        laporan["gerbang_lolos"] = False

    ok = laporan["selesai"] and laporan["gerbang_lolos"]
    print(f"=== HASIL: {'LOLOS' if ok else 'GAGAL'} ===", flush=True)
    with open("/tmp/agent-report.json", "w", encoding="utf-8") as f:
        json.dump(laporan, f, ensure_ascii=False, indent=2)
    with open("/tmp/agent-report.md", "w", encoding="utf-8") as f:
        f.write(f"## Agent `{laporan['id']}` — {laporan['judul']}\n\n")
        f.write(f"**Status: {'✅ LOLOS' if ok else '❌ GAGAL'}**\n\n{laporan['ringkasan']}\n\n")
        if laporan["berkas_diubah"]:
            f.write("Berkas: " + ", ".join(f"`{b}`" for b in laporan["berkas_diubah"]) + "\n\n")
        f.write("Gerbang: " + json.dumps(laporan["gerbang"], ensure_ascii=False) + "\n")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
