from flask import Blueprint, request, jsonify, session
from models import Feedback, User, db

feedback_bp = Blueprint('feedback', __name__)

def require_auth(f):
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@feedback_bp.route('/', methods=['POST'])
@require_auth
def submit_feedback():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['category', 'rating', 'text']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Validate category
        valid_categories = ['Academic', 'Infrastructure', 'Cafeteria', 'Hostel', 'Transport', 'Other']
        if data['category'] not in valid_categories:
            return jsonify({'error': 'Invalid category'}), 400
        
        # Validate rating
        rating = data['rating']
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({'error': 'Rating must be between 1 and 5'}), 400
        
        # Validate text
        if not data['text'].strip():
            return jsonify({'error': 'Feedback text cannot be empty'}), 400
        
        user_id = session['user_id']
        
        feedback = Feedback(
            user_id=user_id,
            category=data['category'],
            rating=rating,
            text=data['text'].strip()
        )
        
        db.session.add(feedback)
        db.session.commit()
        
        return jsonify({
            'message': 'Feedback submitted successfully',
            'feedback': feedback.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to submit feedback'}), 500

@feedback_bp.route('/', methods=['GET'])
def get_feedback():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        category = request.args.get('category')
        rating = request.args.get('rating', type=int)
        
        query = Feedback.query
        
        if category:
            query = query.filter_by(category=category)
        
        if rating:
            query = query.filter_by(rating=rating)
        
        feedback_list = query.order_by(Feedback.created_at.desc())\
                           .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'feedback': [feedback.to_dict() for feedback in feedback_list.items],
            'pagination': {
                'page': feedback_list.page,
                'pages': feedback_list.pages,
                'per_page': feedback_list.per_page,
                'total': feedback_list.total,
                'has_next': feedback_list.has_next,
                'has_prev': feedback_list.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve feedback'}), 500

@feedback_bp.route('/my', methods=['GET'])
@require_auth
def get_my_feedback():
    try:
        user_id = session['user_id']
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        feedback_list = Feedback.query.filter_by(user_id=user_id)\
                                    .order_by(Feedback.created_at.desc())\
                                    .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'feedback': [feedback.to_dict() for feedback in feedback_list.items],
            'pagination': {
                'page': feedback_list.page,
                'pages': feedback_list.pages,
                'per_page': feedback_list.per_page,
                'total': feedback_list.total,
                'has_next': feedback_list.has_next,
                'has_prev': feedback_list.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve feedback'}), 500

@feedback_bp.route('/<int:feedback_id>', methods=['GET'])
def get_feedback_by_id(feedback_id):
    try:
        feedback = Feedback.query.get(feedback_id)
        
        if not feedback:
            return jsonify({'error': 'Feedback not found'}), 404
        
        return jsonify({'feedback': feedback.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve feedback'}), 500

@feedback_bp.route('/<int:feedback_id>', methods=['DELETE'])
@require_auth
def delete_feedback(feedback_id):
    try:
        user_id = session['user_id']
        user = User.query.get(user_id)
        
        feedback = Feedback.query.get(feedback_id)
        if not feedback:
            return jsonify({'error': 'Feedback not found'}), 404
        
        # Only allow deletion by the feedback author or admin
        if feedback.user_id != user_id and not user.is_admin:
            return jsonify({'error': 'Permission denied'}), 403
        
        db.session.delete(feedback)
        db.session.commit()
        
        return jsonify({'message': 'Feedback deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete feedback'}), 500

@feedback_bp.route('/stats', methods=['GET'])
def get_feedback_stats():
    try:
        total_feedback = Feedback.query.count()
        
        # Category breakdown
        categories = db.session.query(Feedback.category, db.func.count(Feedback.id))\
                              .group_by(Feedback.category)\
                              .all()
        
        category_stats = {category: count for category, count in categories}
        
        # Rating breakdown
        ratings = db.session.query(Feedback.rating, db.func.count(Feedback.id))\
                           .group_by(Feedback.rating)\
                           .all()
        
        rating_stats = {f'{rating}_star': count for rating, count in ratings}
        
        # Average rating per category
        avg_ratings = db.session.query(
            Feedback.category, 
            db.func.avg(Feedback.rating).label('avg_rating')
        ).group_by(Feedback.category).all()
        
        category_avg_ratings = {
            category: round(float(avg_rating), 2) 
            for category, avg_rating in avg_ratings
        }
        
        # Overall average rating
        overall_avg = db.session.query(db.func.avg(Feedback.rating)).scalar()
        overall_avg = round(float(overall_avg), 2) if overall_avg else 0
        
        return jsonify({
            'total_feedback': total_feedback,
            'category_stats': category_stats,
            'rating_stats': rating_stats,
            'category_avg_ratings': category_avg_ratings,
            'overall_avg_rating': overall_avg
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve feedback statistics'}), 500

@feedback_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get list of available feedback categories"""
    categories = ['Academic', 'Infrastructure', 'Cafeteria', 'Hostel', 'Transport', 'Other']
    return jsonify({'categories': categories}), 200
