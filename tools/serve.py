#!/usr/bin/env python3
"""Локальный сервер без кэша: python3 -m http.server отдаёт файлы с ETag,
и браузер показывает старый JS. Здесь каждый ответ помечен no-store.

    python3 tools/serve.py [порт]   # по умолчанию 8777
"""
import sys
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
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8777
    root = Path(__file__).resolve().parent.parent
    handler = partial(NoStore, directory=str(root))
    print("http://localhost:%d — %s" % (port, root))
    ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()
