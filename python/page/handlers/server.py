"""The container: this feature's pages.

A page request arrives verbatim — method, target, headers, body — and the
response goes back unwrapped, so this serves ordinary routes rather than the
JSON method routes a job or a sync function is addressed through. Standard
library only.

Prints `LISTENING <port>` once it is up, which is how the local harness (and
`fun up`) learns the port when it binds an ephemeral one.
"""

import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802 - http.server's interface
        if self.path == "/healthz":
            return self._send(200, "text/plain", b"ok")
        if not self.path.startswith("____route____"):
            return self._send(404, "text/plain", b"not found")
        return self._send(200, "text/html", b"<h1>____name____</h1>")

    def log_message(self, fmt, *args):
        print(f"[____name____] {fmt % args}", file=sys.stderr, flush=True)

    def _send(self, status, content_type, body, extra_headers=()):
        self.send_response(status)
        self.send_header("content-type", content_type)
        self.send_header("content-length", str(len(body)))
        for name, value in extra_headers:
            self.send_header(name, value)
        self.end_headers()
        self.wfile.write(body)


def main():
    server = ThreadingHTTPServer(("127.0.0.1", int(os.environ.get("PORT", "0"))), Handler)
    print(f"LISTENING {server.server_address[1]}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
