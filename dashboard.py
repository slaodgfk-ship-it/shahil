from flask import Blueprint, request, jsonify, session
from models import User, Issue, Order, Feedback, LostFoundItem, Ride, RideBooking, db
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__)

def require_auth(f):
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@dashboard_bp.route('/stats', methods=['GET'])
@require_auth
def get_dashboard_stats():
    try:
        user_id = session['user_id']
        
        # User's personal stats
        user_issues = Issue.query.filter_by(user_id=user_id).count()
        user_pending_issues = Issue.query.filter_by(user_id=user_id, status='Pending').count()
        user_resolved_issues = Issue.query.filter_by(user_id=user_id, status='Resolved').count()
        user_orders = Order.query.filter_by(user_id=user_id).count()
        user_feedback = Feedback.query.filter_by(user_id=user_id).count()
        user_lost_found = LostFoundItem.query.filter_by(user_id=user_id).count()
        user_rides_offered = Ride.query.filter_by(driver_id=user_id).count()
        user_rides_booked = RideBooking.query.filter_by(passenger_id=user_id, status='Confirmed').count()
        
        return jsonify({
            'user_stats': {
                'total_issues': user_issues,
                'pending_issues': user_pending_issues,
                'resolved_issues': user_resolved_issues,
                'total_orders': user_orders,
                'total_feedback': user_feedback,
                'lost_found_items': user_lost_found,
                'rides_offered': user_rides_offered,
                'rides_booked': user_rides_booked
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve dashboard statistics'}), 500

@dashboard_bp.route('/recent-activity', methods=['GET'])
@require_auth
def get_recent_activity():
    try:
        user_id = session['user_id']
        limit = request.args.get('limit', 10, type=int)
        
        activities = []
        
        # Recent issues
        recent_issues = Issue.query.filter_by(user_id=user_id)\
                                 .order_by(Issue.created_at.desc())\
                                 .limit(5).all()
        
        for issue in recent_issues:
            activities.append({
                'type': 'issue',
                'title': f'Reported issue: {issue.title}',
                'description': issue.description[:100] + '...' if len(issue.description) > 100 else issue.description,
                'status': issue.status,
                'priority': issue.priority,
                'created_at': issue.created_at.isoformat(),
                'id': issue.id
            })
        
        # Recent orders
        recent_orders = Order.query.filter_by(user_id=user_id)\
                                 .order_by(Order.created_at.desc())\
                                 .limit(5).all()
        
        for order in recent_orders:
            activities.append({
                'type': 'order',
                'title': f'Food order placed',
                'description': f'Total: ₹{order.total_amount}',
                'status': order.status,
                'created_at': order.created_at.isoformat(),
                'id': order.id
            })
        
        # Recent feedback
        recent_feedback = Feedback.query.filter_by(user_id=user_id)\
                                      .order_by(Feedback.created_at.desc())\
                                      .limit(3).all()
        
        for feedback in recent_feedback:
            activities.append({
                'type': 'feedback',
                'title': f'Feedback submitted for {feedback.category}',
                'description': feedback.text[:100] + '...' if len(feedback.text) > 100 else feedback.text,
                'rating': feedback.rating,
                'created_at': feedback.created_at.isoformat(),
                'id': feedback.id
            })
        
        # Recent lost/found items
        recent_lf_items = LostFoundItem.query.filter_by(user_id=user_id)\
                                           .order_by(LostFoundItem.created_at.desc())\
                                           .limit(3).all()
        
        for item in recent_lf_items:
            activities.append({
                'type': 'lost_found',
                'title': f'{item.type.title()} item: {item.name}',
                'description': item.description[:100] + '...' if len(item.description) > 100 else item.description,
                'status': item.status,
                'created_at': item.created_at.isoformat(),
                'id': item.id
            })
        
        # Recent rides
        recent_rides = Ride.query.filter_by(driver_id=user_id)\
                                .order_by(Ride.created_at.desc())\
                                .limit(3).all()
        
        for ride in recent_rides:
            activities.append({
                'type': 'ride',
                'title': f'Ride offered: {ride.from_location} → {ride.to_location}',
                'description': f'Departure: {ride.departure_time.strftime("%Y-%m-%d %H:%M")}',
                'status': ride.status,
                'available_seats': ride.available_seats,
                'created_at': ride.created_at.isoformat(),
                'id': ride.id
            })
        
        # Sort all activities by creation date and limit
        activities.sort(key=lambda x: x['created_at'], reverse=True)
        activities = activities[:limit]
        
        return jsonify({'activities': activities}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve recent activity'}), 500

@dashboard_bp.route('/overview', methods=['GET'])
@require_auth
def get_dashboard_overview():
    try:
        user_id = session['user_id']
        user = User.query.get(user_id)
        
        # Get user stats
        stats_response = get_dashboard_stats()
        user_stats = stats_response[0].get_json()['user_stats']
        
        # Get recent activity
        activity_response = get_recent_activity()
        recent_activities = activity_response[0].get_json()['activities']
        
        # Get upcoming rides (if any)
        upcoming_rides = []
        
        # Rides user is driving
        driving_rides = Ride.query.filter_by(driver_id=user_id, status='Active')\
                                 .filter(Ride.departure_time > datetime.utcnow())\
                                 .order_by(Ride.departure_time)\
                                 .limit(3).all()
        
        for ride in driving_rides:
            upcoming_rides.append({
                'type': 'driving',
                'ride': ride.to_dict()
            })
        
        # Rides user has booked
        booked_rides = db.session.query(Ride)\
                                .join(RideBooking)\
                                .filter(RideBooking.passenger_id == user_id)\
                                .filter(RideBooking.status == 'Confirmed')\
                                .filter(Ride.status == 'Active')\
                                .filter(Ride.departure_time > datetime.utcnow())\
                                .order_by(Ride.departure_time)\
                                .limit(3).all()
        
        for ride in booked_rides:
            upcoming_rides.append({
                'type': 'passenger',
                'ride': ride.to_dict()
            })
        
        # Sort upcoming rides by departure time
        upcoming_rides.sort(key=lambda x: x['ride']['departure_time'])
        
        return jsonify({
            'user': user.to_dict(),
            'stats': user_stats,
            'recent_activities': recent_activities[:5],
            'upcoming_rides': upcoming_rides[:5]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve dashboard overview'}), 500

@dashboard_bp.route('/admin/stats', methods=['GET'])
@require_auth
def get_admin_stats():
    try:
        user = User.query.get(session['user_id'])
        if not user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        # Overall system stats
        total_users = User.query.count()
        total_issues = Issue.query.count()
        pending_issues = Issue.query.filter_by(status='Pending').count()
        total_orders = Order.query.count()
        total_feedback = Feedback.query.count()
        total_lf_items = LostFoundItem.query.count()
        total_rides = Ride.query.count()
        active_rides = Ride.query.filter_by(status='Active')\
                                .filter(Ride.departure_time > datetime.utcnow())\
                                .count()
        
        # Recent activity (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        
        new_users_week = User.query.filter(User.created_at >= week_ago).count()
        new_issues_week = Issue.query.filter(Issue.created_at >= week_ago).count()
        new_orders_week = Order.query.filter(Order.created_at >= week_ago).count()
        
        # Category breakdowns
        issue_categories = db.session.query(Issue.category, db.func.count(Issue.id))\
                                   .group_by(Issue.category)\
                                   .all()
        
        feedback_ratings = db.session.query(Feedback.rating, db.func.count(Feedback.id))\
                                   .group_by(Feedback.rating)\
                                   .all()
        
        return jsonify({
            'system_stats': {
                'total_users': total_users,
                'total_issues': total_issues,
                'pending_issues': pending_issues,
                'total_orders': total_orders,
                'total_feedback': total_feedback,
                'total_lf_items': total_lf_items,
                'total_rides': total_rides,
                'active_rides': active_rides
            },
            'weekly_stats': {
                'new_users': new_users_week,
                'new_issues': new_issues_week,
                'new_orders': new_orders_week
            },
            'breakdowns': {
                'issue_categories': {category: count for category, count in issue_categories},
                'feedback_ratings': {f'{rating}_star': count for rating, count in feedback_ratings}
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve admin statistics'}), 500
