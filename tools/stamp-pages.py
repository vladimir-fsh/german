#!/usr/bin/env python3
"""Stamp the Pages HTML and asset URLs with the current workflow build."""
import os
import json
import re
import sys
from pathlib import Path


def stamp(html, run_number, attempt):
    if not all(re.fullmatch(r"[1-9][0-9]*", value) for value in (run_number, attempt)):
        raise ValueError("Expected positive GitHub run number and attempt")
    version = "v%s.%s" % (run_number, attempt)
    marker = '<meta name="app-version" content="local">'
    if html.count(marker) != 1:
        raise ValueError("Expected one local app-version marker in the source HTML")
    html = html.replace(marker, '<meta name="app-version" content="%s">' % version)
    # Give each release fresh JS/CSS URLs even when the browser cached old assets.
    html = re.sub(r'((?:src|href)="(?:js|data|css)/[^"?]+)(")',
                  lambda match: match[1] + "?v=" + version + match[2], html)
    return html, version


if __name__ == "__main__":
    target = Path(sys.argv[1])
    html, version = stamp(target.read_text(encoding="utf-8"),
                          os.environ["GITHUB_RUN_NUMBER"], os.environ["GITHUB_RUN_ATTEMPT"])
    target.write_text(html, encoding="utf-8")
    target.with_name("version.json").write_text(json.dumps({"version": version}) + "\n", encoding="utf-8")
    print("Pages version: " + version)
