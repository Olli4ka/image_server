import logging
import uuid
from email.parser import BytesParser
from email.policy import default
from http.server import BaseHTTPRequestHandler, HTTPServer
from io import BytesIO
from pathlib import Path

from PIL import Image


HOST = "0.0.0.0"
PORT = 8000

MAX_FILE_SIZE = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif"}

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
IMAGES_DIR = BASE_DIR / "images"
LOGS_DIR = BASE_DIR / "logs"


LOGS_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    filename=LOGS_DIR / "app.log",
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)


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


        if self.path.startswith("/images/"):
            filename = self.path.removeprefix("/images/")
            file_path = IMAGES_DIR / filename

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
            logger.error("Upload failed: expected multipart/form-data")
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
            logger.error("Upload failed: file not found in request")
            self.send_error(400, "File not found")
            return

        filename = uploaded_file.get_filename()
        file_data = uploaded_file.get_payload(decode=True)

        if len(file_data) > MAX_FILE_SIZE:
            logger.error(
                "Upload failed: file size exceeds 5 MB (%d bytes)",
                len(file_data),
            )
            self.send_error(400, "File size exceeds 5 MB")
            return

        file_extension = Path(filename).suffix.lower()

        if file_extension not in ALLOWED_EXTENSIONS:
            logger.error(
                "Upload failed: unsupported file format (%s)",
                file_extension,
            )
            self.send_error(400, "Unsupported file format")
            return

        try:
            image = Image.open(BytesIO(file_data))
            image.verify()
        except (OSError, ValueError):
            logger.error("Upload failed: invalid image file (%s)", filename)
            self.send_error(400, "Invalid image file")
            return

        unique_filename = f"{uuid.uuid4()}{file_extension}"

        image_path = IMAGES_DIR / unique_filename
        image_path.write_bytes(file_data)

        logger.info(
            "Upload successful: original=%s, size=%d bytes, filename=%s",
            filename,
            len(file_data),
            unique_filename,
        )

        image_url = f"/images/{unique_filename}"

        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.end_headers()

        self.wfile.write(image_url.encode("utf-8"))

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
