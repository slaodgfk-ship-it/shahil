from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
CORS(app, supports_credentials=True)

# Import and initialize database
from models import db, User, Issue, Order, OrderItem, Feedback, LostFoundItem, Ride, RideBooking
db.init_app(app)

# Import routes
from routes.auth import auth_bp
from routes.cafeteria import cafeteria_bp
from routes.issues import issues_bp
from routes.lost_found import lost_found_bp
from routes.transport import transport_bp
from routes.feedback import feedback_bp
from routes.dashboard import dashboard_bp

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(cafeteria_bp, url_prefix='/api/cafeteria')
app.register_blueprint(issues_bp, url_prefix='/api/issues')
app.register_blueprint(lost_found_bp, url_prefix='/api/lost-found')
app.register_blueprint(transport_bp, url_prefix='/api/transport')
app.register_blueprint(feedback_bp, url_prefix='/api/feedback')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')

@app.route('/api/health')
def health_check():
    return jsonify({'status': 'healthy', 'message': 'College Portal API is running'})

@app.before_first_request
def create_tables():
    """Create database tables on first request"""
    db.create_all()
    
    # Create default admin user if it doesn't exist
    admin_user = User.query.filter_by(username='admin').first()
    if not admin_user:
        admin = User(
            username='admin',
            email='admin@college.edu',
            password_hash=generate_password_hash('admin123'),
            is_admin=True
        )
        db.session.add(admin)
        db.session.commit()

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
