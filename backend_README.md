# College Portal Backend API

A comprehensive Flask-based REST API for a college portal system with features for cafeteria ordering, issue reporting, lost & found, transport sharing, and feedback management.

## Features

- **User Authentication**: Registration, login, session management
- **Cafeteria System**: Food ordering with menu management
- **Issue Reporting**: Report and track campus issues
- **Lost & Found**: Report lost/found items
- **Transport Sharing**: Ride sharing system
- **Feedback System**: Submit and manage feedback
- **Dashboard**: Personal and admin analytics

## Technology Stack

- **Backend**: Flask, SQLAlchemy
- **Database**: MySQL
- **Authentication**: Session-based with secure password hashing
- **API**: RESTful endpoints with JSON responses

## Installation

### Prerequisites

- Python 3.8+
- MySQL 5.7+ or 8.0+
- pip (Python package manager)

### Setup Instructions

1. **Clone/Download the project**
   ```bash
   cd "c:\xampp\htdocs\hackathon demo\backend"
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Setup MySQL Database**
   - Start your MySQL server (XAMPP/WAMP)
   - Run the database setup script:
   ```sql
   mysql -u root -p < database_setup.sql
   ```

4. **Configure Database Connection**
   - Update `config.py` if needed:
   ```python
   SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:@localhost/college_portal'
   ```

5. **Run the Application**
   ```bash
   python app.py
   ```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/check-session` - Check authentication status

### Cafeteria
- `GET /api/cafeteria/menu` - Get menu items
- `POST /api/cafeteria/orders` - Place food order
- `GET /api/cafeteria/orders` - Get user orders
- `GET /api/cafeteria/orders/<id>` - Get specific order
- `PUT /api/cafeteria/orders/<id>/cancel` - Cancel order

### Issues
- `POST /api/issues/` - Report new issue
- `GET /api/issues/` - Get all issues (with filters)
- `GET /api/issues/my` - Get user's issues
- `GET /api/issues/<id>` - Get specific issue
- `POST /api/issues/<id>/upvote` - Upvote issue
- `PUT /api/issues/<id>/status` - Update issue status (admin)
- `DELETE /api/issues/<id>` - Delete issue

### Lost & Found
- `POST /api/lost-found/items` - Report lost/found item
- `GET /api/lost-found/items` - Get all items (with search)
- `GET /api/lost-found/items/my` - Get user's items
- `GET /api/lost-found/items/<id>` - Get specific item
- `PUT /api/lost-found/items/<id>` - Update item
- `PUT /api/lost-found/items/<id>/resolve` - Mark as resolved
- `DELETE /api/lost-found/items/<id>` - Delete item

### Transport
- `POST /api/transport/rides` - Offer ride
- `GET /api/transport/rides` - Search available rides
- `GET /api/transport/rides/my` - Get user's offered rides
- `GET /api/transport/rides/<id>` - Get specific ride
- `POST /api/transport/rides/<id>/book` - Book ride
- `GET /api/transport/bookings/my` - Get user's bookings
- `PUT /api/transport/bookings/<id>/cancel` - Cancel booking
- `PUT /api/transport/rides/<id>/cancel` - Cancel ride

### Feedback
- `POST /api/feedback/` - Submit feedback
- `GET /api/feedback/` - Get all feedback
- `GET /api/feedback/my` - Get user's feedback
- `GET /api/feedback/<id>` - Get specific feedback
- `DELETE /api/feedback/<id>` - Delete feedback
- `GET /api/feedback/categories` - Get feedback categories

### Dashboard
- `GET /api/dashboard/stats` - Get user statistics
- `GET /api/dashboard/recent-activity` - Get recent activity
- `GET /api/dashboard/overview` - Get dashboard overview
- `GET /api/dashboard/admin/stats` - Get admin statistics

## Database Schema

The system uses the following main tables:
- `users` - User accounts and authentication
- `issues` - Campus issue reports
- `orders` & `order_items` - Food orders and items
- `feedback` - User feedback submissions
- `lost_found_items` - Lost and found items
- `rides` & `ride_bookings` - Transport sharing system

## Configuration

### Environment Variables
- `DATABASE_URL` - MySQL connection string
- `SECRET_KEY` - Flask secret key for sessions

### Default Admin Account
- Username: `admin`
- Password: `admin123`
- Email: `admin@college.edu`

## Security Features

- Password hashing using Werkzeug
- Session-based authentication
- CORS support for frontend integration
- SQL injection prevention via SQLAlchemy ORM
- Input validation and sanitization

## Error Handling

The API returns appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Development

### Running in Development Mode
```bash
export FLASK_ENV=development
python app.py
```

### Database Migrations
If you modify the models, you may need to recreate the database:
```bash
mysql -u root -p -e "DROP DATABASE college_portal; CREATE DATABASE college_portal;"
mysql -u root -p college_portal < database_setup.sql
```

## Production Deployment

For production deployment:

1. Set environment variables:
   ```bash
   export FLASK_ENV=production
   export SECRET_KEY=your-secure-secret-key
   export DATABASE_URL=mysql+pymysql://user:password@host/database
   ```

2. Use a production WSGI server:
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

3. Configure reverse proxy (nginx/Apache)
4. Enable HTTPS and update CORS settings

## API Testing

You can test the API using tools like:
- Postman
- curl
- Python requests library

Example curl request:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

## Support

For issues or questions, please check the error logs and ensure:
1. MySQL server is running
2. Database exists and is accessible
3. All dependencies are installed
4. Configuration is correct
