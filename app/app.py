from http.server import BaseHTTPRequestHandler, HTTPServer


HOST = "0.0.0.0"
PORT = 8000


class ImageServerHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.end_headers()

        self.wfile.write(b"Image Server is running!")


def run_server():
    server_address = (HOST, PORT)
    server = HTTPServer(server_address, ImageServerHandler)

    print(f"Server running on http://localhost:{PORT}")

    server.serve_forever()


if __name__ == "__main__":
    run_server()