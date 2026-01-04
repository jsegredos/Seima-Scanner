#!/usr/bin/env python3
"""
Seima Scanner - Development Web Server
Simple HTTP server with proper MIME types for ES6 modules
"""

import http.server
import socketserver
import webbrowser
import sys
import os
from pathlib import Path

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler to set proper MIME types for ES6 modules"""
    
    def end_headers(self):
        # Add CORS headers for development and external image loading
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # Comment out restrictive headers that block external images
        # self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        # self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        super().end_headers()
    
    def guess_type(self, path):
        """Override to set proper MIME type for .js files"""
        # Handle both old and new Python versions
        result = super().guess_type(path)
        if isinstance(result, tuple) and len(result) == 2:
            mimetype, encoding = result
        else:
            # For newer Python versions that might return different format
            mimetype = result if isinstance(result, str) else 'application/octet-stream'
            encoding = None
        
        # Ensure .js files are served with the correct MIME type for ES6 modules
        if str(path).endswith('.js'):
            return 'application/javascript'
        
        return mimetype

def main():
    """Start the development server"""
    # Change to the script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    PORT = 8000
    
    print(f"Seima Scanner Server starting on http://localhost:{PORT}")
    print(f"Root directory: {script_dir}")
    print("Press Ctrl+C to stop the server")
    
    try:
        # Bind to all interfaces (0.0.0.0) to allow mobile device access
        with socketserver.TCPServer(("0.0.0.0", PORT), CustomHTTPRequestHandler) as httpd:
            server_url = f"http://localhost:{PORT}"
            # Get local IP address for mobile access
            import socket
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
            network_url = f"http://{local_ip}:{PORT}"
            
            # Auto-open browser
            try:
                webbrowser.open(server_url)
                print(f"Browser opened to {server_url}")
            except Exception as e:
                print(f"Could not auto-open browser: {e}")
                print(f"Please open {server_url} manually")
            
            print("Server is running...")
            print(f"Local access: {server_url}")
            print(f"Network access (for mobile): {network_url}")
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\nServer stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 