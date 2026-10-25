#!/usr/bin/env python3
"""Fetch and compare the official Google source registry.

This verifier reports source availability and material hash changes. It does
not decide site readiness; the skill must interpret changes conservatively and
fail closed when a material source is unavailable or its meaning is unclear.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

try:
    from bs4 import BeautifulSoup
except ImportError:  # pragma: no cover
    BeautifulSoup = None

SOURCES = {
    "G-ADS-READY": "https://support.google.com/adsense/answer/7299563?hl=en",
    "G-ADS-POLICY": "https://support.google.com/adsense/answer/10502938?hl=en",
    "G-ADS-PROGRAM": "https://support.google.com/adsense/answer/48182?hl=en",
    "G-ADS-RESTRICTIONS": "https://support.google.com/adsense/answer/10437795?hl=en",
    "G-ADS-IMPLEMENTATION": "https://support.google.com/adsense/topic/1271508?hl=en",
    "G-ADS-CHANGELOG": "https://support.google.com/adsense/answer/9336650?hl=en",
    "G-ADS-CONSENT": "https://support.google.com/adsense/answer/10961068?hl=en",
    "G-SEARCH-ESSENTIALS": "https://developers.google.com/search/docs/essentials",
    "G-SEARCH-SPAM": "https://developers.google.com/search/docs/essentials/spam-policies",
    "G-SEARCH-HELPFUL": "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
    "G-SEARCH-GENAI": "https://developers.google.com/search/docs/fundamentals/using-gen-ai-content",
    "G-SEARCH-CWV": "https://developers.google.com/search/docs/appearance/core-web-vitals",
    "G-SEARCH-PAGE": "https://developers.google.com/search/docs/appearance/page-experience",
    "G-SEARCH-STRUCTURED": "https://developers.google.com/search/docs/appearance/structured-data/sd-policies",
    "G-SEARCH-ROBOTS": "https://developers.google.com/search/docs/crawling-indexing/robots/intro",
}
EXPECTED_HOSTS = {"support.google.com", "developers.google.com"}


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def visible_text(html: str) -> str:
    if BeautifulSoup is not None:
        soup = BeautifulSoup(html, "html.parser")
        for node in soup(["script", "style", "noscript", "template", "svg"]):
            node.decompose()
        primary = soup.find("main") or soup.find("article") or soup.find(attrs={"role": "main"}) or soup.body or soup
        return normalize(primary.get_text(" "))
    stripped = re.sub(r"<(script|style|noscript|template|svg)[^>]*>.*?</\\1>", " ", html, flags=re.I | re.S)
    return normalize(re.sub(r"<[^>]+>", " ", stripped))


def fetch(url: str) -> dict:
    req = Request(url, headers={"User-Agent": "AdSense-Final-Gate-Auditor/1.1"})
    try:
        with urlopen(req, timeout=20) as response:
            raw = response.read()
            text = raw.decode("utf-8", errors="replace")
            title_match = re.search(r"<title[^>]*>(.*?)</title>", text, re.I | re.S)
            title = normalize(re.sub(r"<[^>]+>", " ", title_match.group(1))) if title_match else ""
            readable = visible_text(text)
            update_matches = re.findall(r"(?:last updated|updated|updated on|last modified)[^\n<]{0,120}", readable, re.I)
            final_url = response.geturl()
            final_host = urlparse(final_url).hostname or ""
            return {
                "url": url,
                "status": response.status,
                "final_url": final_url,
                "host_ok": final_host in EXPECTED_HOSTS,
                "title": title,
                "update_signals": [normalize(x) for x in update_matches[:5]],
                "sha256": hashlib.sha256(readable.encode()).hexdigest(),
                "bytes": len(raw),
                "ok": response.status == 200 and final_host in EXPECTED_HOSTS and bool(title),
            }
    except (HTTPError, URLError, TimeoutError, OSError) as exc:
        return {"url": url, "ok": False, "error": f"{type(exc).__name__}: {exc}"}


def load_previous(path: str | None) -> dict:
    if not path:
        return {}
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return {"_error": f"Could not read previous snapshot: {exc}"}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("-o", "--output", default="runtime_policy_snapshot.json")
    parser.add_argument("--previous", help="Previous JSON snapshot for hash/title comparison")
    args = parser.parse_args()
    timestamp = datetime.now(timezone.utc).isoformat()
    previous = load_previous(args.previous)
    previous_sources = previous.get("sources", {}) if isinstance(previous, dict) else {}
    results = {key: fetch(url) for key, url in SOURCES.items()}
    failed = [key for key, value in results.items() if not value.get("ok")]
    changed = []
    for key, value in results.items():
        old = previous_sources.get(key, {})
        if old and value.get("ok") and (old.get("sha256") != value.get("sha256") or old.get("title") != value.get("title")):
            changed.append(key)
    snapshot = {
        "retrieved_at_utc": timestamp,
        "source_count": len(SOURCES),
        "failed_sources": failed,
        "changed_sources": changed,
        "previous_snapshot_error": previous.get("_error") if isinstance(previous, dict) else None,
        "verification_status": "NEEDS_HUMAN_REVIEW" if failed or changed or previous.get("_error") else "PASS",
        "sources": results,
    }
    Path(args.output).write_text(json.dumps(snapshot, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(snapshot, indent=2))
    return 2 if failed or changed or previous.get("_error") else 0


if __name__ == "__main__":
    sys.exit(main())
