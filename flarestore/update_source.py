#!/usr/bin/env python3
"""Build an AltStore-compatible source with direct links to original GitHub IPAs."""
from __future__ import annotations

import io
import json
import os
from pathlib import Path
import plistlib
import re
import sys
import urllib.request
import zipfile

OUT = Path(__file__).with_name("source.json")
USER_AGENT = "Ezequiel-FlareStore-Source/1.0"
WQ_URL = "https://raw.githubusercontent.com/kolbicz/WQFiles/main/source.json"
TETHERLESS_URL = "https://api.github.com/repos/pwnapplehat/TetherlessiOS/releases?per_page=15"
MAX_BYTES = 60 * 1024 * 1024

def download(url: str, limit: int = MAX_BYTES) -> bytes:
    headers = {"User-Agent": USER_AGENT, "Accept": "application/vnd.github+json"}
    token = os.environ.get("GITHUB_TOKEN")
    if token and url.startswith("https://api.github.com/"):
        headers["Authorization"] = "Bearer " + token
    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=90) as response:
        data = response.read(limit + 1)
    if len(data) > limit:
        raise ValueError("File too large: " + url)
    return data

def get_json(url):
    return json.loads(download(url, 5 * 1024 * 1024).decode("utf-8"))

def inspect_ipa(url):
    with zipfile.ZipFile(io.BytesIO(download(url))) as ipa:
        names = [name for name in ipa.namelist()
                 if re.fullmatch(r"Payload/[^/]+\.app/Info\.plist", name)]
        if len(names) != 1:
            raise ValueError("Missing or ambiguous Info.plist: " + url)
        if ipa.getinfo(names[0]).file_size > 1024 * 1024:
            raise ValueError("Unexpectedly large Info.plist")
        info = plistlib.loads(ipa.read(names[0]))
    result = (info["CFBundleIdentifier"], info["CFBundleShortVersionString"],
              info["CFBundleVersion"])
    if any(not isinstance(value, str) or not value for value in result):
        raise ValueError("Invalid IPA bundle identifier, version or build")
    return result

def main():
    official = get_json(WQ_URL)
    wq = next((app for app in official.get("apps", [])
               if app.get("bundleIdentifier") == "cz.kolbi.wqfiles"), None)
    if not wq or not wq.get("versions"):
        raise ValueError("WQ Files is missing from its official source")
    for v in wq["versions"]:
        if not v.get("downloadURL", "").startswith("https://github.com/kolbicz/WQFiles/releases/download/"):
            raise ValueError("Unexpected WQ Files download host")
    releases = get_json(TETHERLESS_URL)
    if not isinstance(releases, list):
        raise ValueError("Unexpected Tetherless API response")
    releases = sorted((r for r in releases if not r.get("draft") and not r.get("prerelease")),
                      key=lambda r: r.get("published_at") or "", reverse=True)
    versions = []
    bundle_id = None
    for release in releases:
        modern = next((a for a in release.get("assets", [])
                       if re.fullmatch(r"Tetherless-[0-9.]+-Modern\.ipa", a.get("name", ""))), None)
        if modern is None:
            continue
        url = modern["browser_download_url"]
        if not url.startswith("https://github.com/pwnapplehat/TetherlessiOS/releases/download/"):
            raise ValueError("Unexpected Tetherless download host")
        this_id, version, build = inspect_ipa(url)
        if bundle_id is None:
            bundle_id = this_id
        elif this_id != bundle_id:
            raise ValueError("Tetherless changed bundleIdentifier between versions")
        date = release.get("published_at") or release.get("created_at")
        if not date:
            raise ValueError("Tetherless release is missing its date")
        versions.append({
            "version": version,
            "buildVersion": build,
            "date": date[:10],
            "size": modern["size"],
            "downloadURL": url,
            "localizedDescription": (release.get("body") or "Official release.")[:1200],
            "minOSVersion": "26.0"
        })
        if len(versions) >= 5:
            break
    if not bundle_id or not versions:
        raise ValueError("No Tetherless Modern release available; previous file stays unchanged")
    app = {
        "name": "Tetherless (Modern)",
        "bundleIdentifier": bundle_id,
        "developerName": "pwnapplehat",
        "subtitle": "Firma y administra aplicaciones en iOS 26+",
        "localizedDescription": "Herramienta para firmar e instalar IPA directamente desde el iPhone. Edición Modern para iOS 26 y posteriores. La fuente no está afiliada a sus desarrolladores.",
        "iconURL": "https://raw.githubusercontent.com/pwnapplehat/TetherlessiOS/main/assets/icon-180.png",
        "tintColor": "#7B61FF",
        "category": "utilities",
        "versions": versions
    }
    feed = {
        "name": "Ezequiel | FlareStore Apps",
        "identifier": "ni.ioezgamer.flarestore.apps",
        "subtitle": "WQ Files y Tetherless, desde sus versiones oficiales",
        "description": "Fuente independiente para FlareStore, AltStore o SideStore. Las IPA se descargan directamente desde GitHub; no se modifican ni se alojan aquí.",
        "iconURL": "https://raw.githubusercontent.com/kolbicz/WQFiles/main/icons/AppIcon1024.png",
        "tintColor": "#1E8FC7",
        "website": "https://github.com/ioezgamer/proyectos_gratioez/tree/main/flarestore",
        "featuredApps": [wq["bundleIdentifier"], bundle_id],
        "apps": [wq, app]
    }
    contents = json.dumps(feed, ensure_ascii=False, indent=2) + "\n"
    if not OUT.exists() or OUT.read_text(encoding="utf-8") != contents:
        OUT.write_text(contents, encoding="utf-8")
        print("Updated:", [(a["name"], a["versions"][0]["version"]) for a in feed["apps"]])
    else:
        print("Already up to date")

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print("Update failed; previous source remains unchanged:", exc, file=sys.stderr)
        raise
