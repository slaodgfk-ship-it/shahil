#!/usr/bin/env python3
"""
College Portal Backend - Production Runner
"""

from app import app
import os

if __name__ == '__main__':
    # Get port from environment variable or default to 5000
    port = int(os.environ.get('PORT', 5000))
    
    # Get host from environment variable or default to localhost
    host = os.environ.get('HOST', '0.0.0.0')
    
    # Get debug mode from environment
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"Starting College Portal API server...")
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"Debug: {debug}")
    print(f"Environment: {os.environ.get('FLASK_ENV', 'production')}")
    
    app.run(
        host=host,
        port=port,
        debug=debug
    )
