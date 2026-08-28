"""Payal Digital Studio local server.

Run:  py studio_server.py
Open: http://localhost:8000

It serves the website and securely saves form enquiries in data/enquiries.json.
"""

from __future__ import annotations

import json
import mimetypes
import re
from datetime import UTC, datetime
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from secrets import token_urlsafe
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent
DATA_FILE = ROOT / "data" / "enquiries.json"
MAX_BODY_SIZE = 20_000


def json_response(handler: BaseHTTPRequestHandler, payload: dict, status: int = 200) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-store")
    handler.end_headers()
    handler.wfile.write(body)


def clean_text(value: object, limit: int = 600) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip())[:limit]


class StudioHandler(BaseHTTPRequestHandler):
    server_version = "PayalStudio/1.0"

    def log_message(self, fmt: str, *args: object) -> None:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {self.address_string()} - {fmt % args}")

    def do_GET(self) -> None:
        path = unquote(urlparse(self.path).path)
        if path == "/api/health":
            return json_response(self, {"ok": True, "service": "Payal Digital Studio"})
        if path == "/api/enquiries":
            return self.list_enquiries()
        if path == "/":
            path = "/index.html"
        target = (ROOT / path.lstrip("/")).resolve()
        if ROOT not in target.parents or not target.is_file():
            return self.send_error(HTTPStatus.NOT_FOUND, "File not found")
        content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        try:
            content = target.read_bytes()
        except OSError:
            return self.send_error(HTTPStatus.INTERNAL_SERVER_ERROR, "Could not read file")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", f"{content_type}; charset=utf-8" if content_type.startswith("text/") else content_type)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_POST(self) -> None:
        if urlparse(self.path).path != "/api/enquiries":
            return self.send_error(HTTPStatus.NOT_FOUND, "Endpoint not found")
        length = int(self.headers.get("Content-Length", "0"))
        if not 0 < length <= MAX_BODY_SIZE:
            return json_response(self, {"ok": False, "error": "Invalid request size."}, 400)
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return json_response(self, {"ok": False, "error": "Please send valid form data."}, 400)
        enquiry = {key: clean_text(payload.get(key), 1000 if key == "message" else 180) for key in ("name", "phone", "service", "date", "location", "message")}
        if not enquiry["name"] or not enquiry["phone"] or not enquiry["service"]:
            return json_response(self, {"ok": False, "error": "Name, phone and service are required."}, 422)
        enquiry["id"] = f"PDS-{datetime.now().strftime('%Y%m%d')}-{token_urlsafe(4).upper()}"
        enquiry["received_at"] = datetime.now(UTC).isoformat()
        DATA_FILE.parent.mkdir(exist_ok=True)
        records = []
        if DATA_FILE.exists():
            try:
                records = json.loads(DATA_FILE.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                records = []
        records.append(enquiry)
        DATA_FILE.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
        return json_response(self, {"ok": True, "booking_id": enquiry["id"], "message": "Your enquiry has been saved."}, 201)

    def list_enquiries(self) -> None:
        if not DATA_FILE.exists():
            return json_response(self, {"ok": True, "enquiries": []})
        try:
            records = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            records = []
        return json_response(self, {"ok": True, "enquiries": records})


if __name__ == "__main__":
    print("Payal Digital Studio is ready at http://localhost:8000")
    ThreadingHTTPServer(("127.0.0.1", 8000), StudioHandler).serve_forever()
