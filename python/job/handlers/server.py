"""The container: the same routes the platform addresses a function through.

`POST /<method>` is how a job or a sync function is invoked; a page is reached
at its own path with its own method. Standard library only — an image is a URL,
and the platform never sees what is behind it.

Prints `LISTENING <port>` once it is up, which is how the local harness (and
`fun up`) learns the port when it binds an ephemeral one.
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from ____method____ import ____method____


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):  # noqa: N802 - http.server's interface
        method = self.path.strip("/")
        if method != "____method____":
            return self._json(404, {"ok": False, "error": f"no method {method}"})

        length = int(self.headers.get("content-length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            params = json.loads(raw or b"{}")
        except json.JSONDecodeError as err:
            # A malformed body is a caller bug; failing here is what makes the
            # job retryable rather than silently succeeding on nothing.
            return self._json(400, {"ok": False, "error": f"invalid JSON body: {err}"})

        try:
            result = ____method____(params, dict(self.headers))
        except Exception as err:  # the platform reads the envelope, not the traceback
            print(f"____method____ failed: {err}", file=sys.stderr, flush=True)
            return self._json(500, {"ok": False, "error": str(err)})

        return self._json(200, result)

    def do_GET(self):  # noqa: N802 - http.server's interface
        if self.path == "/healthz":
            return self._json(200, {"ok": True})
        return self._json(404, {"ok": False, "error": "not found"})

    def log_message(self, fmt, *args):
        print(f"[____name____] {fmt % args}", file=sys.stderr, flush=True)

    def _json(self, status, body):
        payload = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


def main():
    server = ThreadingHTTPServer(("127.0.0.1", int(os.environ.get("PORT", "0"))), Handler)
    print(f"LISTENING {server.server_address[1]}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
