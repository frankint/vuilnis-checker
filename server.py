#!/usr/bin/env python3
"""
Spaarnelanden Afval & Container Checker Local Server & CORS Proxy

Run this server with:
    python server.py

Then open your browser at:
    http://localhost:8000/?postcode=2023BA&house_number=29&sRegistrationNumber=81167
"""

import http.server
import socketserver
import urllib.request
import urllib.error
import sys
import os

PORT = 8000

class WasteCheckerHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Proxy endpoint for container data
        if self.path.startswith('/api/inzameling'):
            try:
                url = "https://inzameling.spaarnelanden.nl/"
                req = urllib.request.Request(
                    url,
                    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
                )
                with urllib.request.urlopen(req) as response:
                    content = response.read()
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html; charset=utf-8')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(content)
                    return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'text/plain')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(f"Proxy error: {str(e)}".encode('utf-8'))
                return

        # Serve static files for all other routes
        return super().do_GET()

def run():
    # Ensure working directory is the app root
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), WasteCheckerHandler) as httpd:
        print("=" * 60)
        print(f"Spaarnelanden Afval & Container Checker Server is running!")
        print(f"Open in your browser: http://localhost:{PORT}/?postcode=2023BA&house_number=29&sRegistrationNumber=81167")
        print("=" * 60)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer gestopt.")
            sys.exit(0)

if __name__ == "__main__":
    run()
