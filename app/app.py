from email.parser import BytesParser
from email.policy import default
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path


HOST = "0.0.0.0"
PORT = 8000

MAX_FILE_SIZE = 5 * 1024 * 1024

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"


class ImageServerHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/":
            self.serve_file(STATIC_DIR / "index.html", "text/html")
            return

        if self.path == "/upload":
            self.serve_file(STATIC_DIR / "upload.html", "text/html")
            return


        if self.path.startswith("/static/"):
            relative_path = self.path.removeprefix("/static/")
            file_path = STATIC_DIR / relative_path

            if file_path.is_file():
                content_type = self.get_content_type(file_path)
                self.serve_file(file_path, content_type)
                return

        self.send_error(404, "Not Found")

    def do_POST(self):
        if self.path != "/upload":
            self.send_error(404, "Not Found")
            return

        content_type = self.headers.get("Content-Type")
        content_length = int(self.headers.get("Content-Length", 0))

        if not content_type or not content_type.startswith("multipart/form-data"):
            self.send_error(400, "Expected multipart/form-data")
            return

        body = self.rfile.read(content_length)

        mime_message = (
            f"Content-Type: {content_type}\r\n"
            "MIME-Version: 1.0\r\n"
            "\r\n"
        ).encode("utf-8") + body

        message = BytesParser(policy=default).parsebytes(mime_message)

        uploaded_file = None

        for part in message.iter_parts():
            if part.get_param("name", header="Content-Disposition") == "file":
                uploaded_file = part
                break

        if uploaded_file is None:
            self.send_error(400, "File not found")
            return

        filename = uploaded_file.get_filename()
        file_data = uploaded_file.get_payload(decode=True)

        if len(file_data) > MAX_FILE_SIZE:
            self.send_error(400, "File size exceeds 5 MB")
            return

        print(f"Received file: {filename}")
        print(f"File size: {len(file_data)} bytes")

        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.end_headers()

        self.wfile.write(
            f"Received file: {filename}".encode("utf-8")
        )

    def serve_file(self, file_path, content_type):
        try:
            content = file_path.read_bytes()
        except FileNotFoundError:
            self.send_error(404, "File Not Found")
            return

        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()

        self.wfile.write(content)

    @staticmethod
    def get_content_type(file_path):
        suffix = file_path.suffix.lower()

        content_types = {
            ".html": "text/html; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
        }

        return content_types.get(suffix, "application/octet-stream")


def run_server():
    server_address = (HOST, PORT)
    server = HTTPServer(server_address, ImageServerHandler)

    print(f"Server running on http://localhost:{PORT}")

    server.serve_forever()


if __name__ == "__main__":
    run_server()
