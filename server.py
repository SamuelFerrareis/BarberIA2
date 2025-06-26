#!/usr/bin/env python3
"""
Simple HTTP server with environment variable injection for the barbershop management system.
This replaces the basic Python HTTP server and injects Supabase credentials securely.
"""

import os
import http.server
import socketserver
import urllib.parse
from pathlib import Path

class BarbershopHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL
        parsed_path = urllib.parse.urlparse(self.path)
        
        # Handle root request
        if parsed_path.path == '/' or parsed_path.path == '/index.html':
            self.serve_index_with_env()
        # Handle config.js with environment variables
        elif parsed_path.path == '/scripts/config.js':
            self.serve_config_with_env()
        else:
            # Serve other files normally
            super().do_GET()
    
    def serve_index_with_env(self):
        """Serve index.html with environment variables injected"""
        try:
            with open('index.html', 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Inject environment variables as script tags before closing head
            env_script = f'''
    <script>
        // Environment variables injected by server
        window.SUPABASE_URL = '{os.getenv("SUPABASE_URL", "")}';
        window.SUPABASE_ANON_KEY = '{os.getenv("SUPABASE_ANON_KEY", "")}';
    </script>
</head>'''
            
            content = content.replace('</head>', env_script)
            
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(content.encode('utf-8'))))
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))
            
        except FileNotFoundError:
            self.send_error(404, 'Index file not found')
        except Exception as e:
            self.send_error(500, f'Server error: {str(e)}')
    
    def serve_config_with_env(self):
        """Serve config.js with environment variables injected"""
        try:
            with open('scripts/config.js', 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace template variables with actual environment variables
            content = content.replace('{{SUPABASE_URL}}', os.getenv('SUPABASE_URL', ''))
            content = content.replace('{{SUPABASE_ANON_KEY}}', os.getenv('SUPABASE_ANON_KEY', ''))
            
            self.send_response(200)
            self.send_header('Content-type', 'application/javascript; charset=utf-8')
            self.send_header('Content-Length', str(len(content.encode('utf-8'))))
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))
            
        except FileNotFoundError:
            self.send_error(404, 'Config file not found')
        except Exception as e:
            self.send_error(500, f'Server error: {str(e)}')

def run_server(port=5000):
    """Run the HTTP server with environment variable injection"""
    
    print(f"🏪 Barbershop Management System Server")
    print(f"📡 Starting server on port {port}...")
    
    # Check for required environment variables
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_ANON_KEY')
    
    if not supabase_url:
        print("⚠️  Warning: SUPABASE_URL environment variable not set")
    else:
        print(f"✅ Supabase URL configured: {supabase_url[:30]}...")
        
    if not supabase_key:
        print("⚠️  Warning: SUPABASE_ANON_KEY environment variable not set")
    else:
        print("✅ Supabase API key configured")
    
    print(f"🌐 Server will be available at: http://localhost:{port}")
    print("📱 Access from mobile: use your computer's IP address")
    print("🔄 To stop the server, press Ctrl+C")
    print("-" * 50)
    
    with socketserver.TCPServer(("0.0.0.0", port), BarbershopHTTPRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped by user")
        except Exception as e:
            print(f"❌ Server error: {e}")

if __name__ == "__main__":
    # Get port from environment or use default
    port = int(os.getenv('PORT', 5000))
    run_server(port)