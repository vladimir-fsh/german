#!/usr/bin/env python3
"""Локальный сервер без кэша: python3 -m http.server отдаёт файлы с ETag,
и браузер показывает старый JS. Здесь каждый ответ помечен no-store.

    python3 tools/serve.py [порт]   # по умолчанию 8777
"""
import sys
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class NoStore(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.command, self.path))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Локальный сервер курса без кэша")
    parser.add_argument("port", nargs="?", type=int, default=8777)
    parser.add_argument("--host", default="127.0.0.1", help="Для телефона в локальной сети: 0.0.0.0")
    args = parser.parse_args()
    port = args.port
    root = Path(__file__).resolve().parent.parent
    handler = partial(NoStore, directory=str(root))
    print("http://%s:%d - %s" % (args.host, port, root), flush=True)
    ThreadingHTTPServer((args.host, port), handler).serve_forever()
