from flask import Blueprint, request, jsonify, session
from models import Issue, User, db
from werkzeug.utils import secure_filename
import os

issues_bp = Blueprint('issues', __name__)

def require_auth(f):
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@issues_bp.route('/', methods=['POST'])
@require_auth
def create_issue():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['category', 'title', 'description', 'location', 'priority']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Validate priority
        if data['priority'] not in ['Low', 'Medium', 'High', 'Critical']:
            return jsonify({'error': 'Invalid priority level'}), 400
        
        # Validate category
        valid_categories = ['Infrastructure', 'Electrical', 'Plumbing', 'Cleaning', 'Security', 'Internet', 'Other']
        if data['category'] not in valid_categories:
            return jsonify({'error': 'Invalid category'}), 400
        
        user_id = session['user_id']
        
        issue = Issue(
            user_id=user_id,
            category=data['category'],
            title=data['title'].strip(),
            description=data['description'].strip(),
            location=data['location'].strip(),
            priority=data['priority'],
            status='Pending'
        )
        
        db.session.add(issue)
        db.session.commit()
        
        return jsonify({
            'message': 'Issue reported successfully',
            'issue': issue.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create issue'}), 500

@issues_bp.route('/', methods=['GET'])
def get_issues():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        category = request.args.get('category')
        status = request.args.get('status')
        priority = request.args.get('priority')
        
        query = Issue.query
        
        if category:
            query = query.filter_by(category=category)
        if status:
            query = query.filter_by(status=status)
        if priority:
            query = query.filter_by(priority=priority)
        
        issues = query.order_by(Issue.created_at.desc())\
                     .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'issues': [issue.to_dict() for issue in issues.items],
            'pagination': {
                'page': issues.page,
                'pages': issues.pages,
                'per_page': issues.per_page,
                'total': issues.total,
                'has_next': issues.has_next,
                'has_prev': issues.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve issues'}), 500

@issues_bp.route('/my', methods=['GET'])
@require_auth
def get_my_issues():
    try:
        user_id = session['user_id']
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        
        query = Issue.query.filter_by(user_id=user_id)
        
        if status:
            query = query.filter_by(status=status)
        
        issues = query.order_by(Issue.created_at.desc())\
                     .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'issues': [issue.to_dict() for issue in issues.items],
            'pagination': {
                'page': issues.page,
                'pages': issues.pages,
                'per_page': issues.per_page,
                'total': issues.total,
                'has_next': issues.has_next,
                'has_prev': issues.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve issues'}), 500

@issues_bp.route('/<int:issue_id>', methods=['GET'])
def get_issue(issue_id):
    try:
        issue = Issue.query.get(issue_id)
        
        if not issue:
            return jsonify({'error': 'Issue not found'}), 404
        
        return jsonify({'issue': issue.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve issue'}), 500

@issues_bp.route('/<int:issue_id>/upvote', methods=['POST'])
@require_auth
def upvote_issue(issue_id):
    try:
        issue = Issue.query.get(issue_id)
        
        if not issue:
            return jsonify({'error': 'Issue not found'}), 404
        
        issue.upvotes += 1
        db.session.commit()
        
        return jsonify({
            'message': 'Issue upvoted successfully',
            'upvotes': issue.upvotes
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to upvote issue'}), 500

@issues_bp.route('/<int:issue_id>/status', methods=['PUT'])
@require_auth
def update_issue_status(issue_id):
    try:
        # Check if user is admin
        user = User.query.get(session['user_id'])
        if not user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status not in ['Pending', 'In Progress', 'Resolved', 'Closed']:
            return jsonify({'error': 'Invalid status'}), 400
        
        issue = Issue.query.get(issue_id)
        if not issue:
            return jsonify({'error': 'Issue not found'}), 404
        
        issue.status = new_status
        db.session.commit()
        
        return jsonify({
            'message': 'Issue status updated successfully',
            'issue': issue.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update issue status'}), 500

@issues_bp.route('/stats', methods=['GET'])
def get_issue_stats():
    try:
        total_issues = Issue.query.count()
        pending_issues = Issue.query.filter_by(status='Pending').count()
        in_progress_issues = Issue.query.filter_by(status='In Progress').count()
        resolved_issues = Issue.query.filter_by(status='Resolved').count()
        
        # Category breakdown
        categories = db.session.query(Issue.category, db.func.count(Issue.id))\
                              .group_by(Issue.category)\
                              .all()
        
        category_stats = {category: count for category, count in categories}
        
        # Priority breakdown
        priorities = db.session.query(Issue.priority, db.func.count(Issue.id))\
                              .group_by(Issue.priority)\
                              .all()
        
        priority_stats = {priority: count for priority, count in priorities}
        
        return jsonify({
            'total_issues': total_issues,
            'pending_issues': pending_issues,
            'in_progress_issues': in_progress_issues,
            'resolved_issues': resolved_issues,
            'category_stats': category_stats,
            'priority_stats': priority_stats
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve issue statistics'}), 500

@issues_bp.route('/<int:issue_id>', methods=['DELETE'])
@require_auth
def delete_issue(issue_id):
    try:
        user_id = session['user_id']
        user = User.query.get(user_id)
        
        issue = Issue.query.get(issue_id)
        if not issue:
            return jsonify({'error': 'Issue not found'}), 404
        
        # Only allow deletion by the issue creator or admin
        if issue.user_id != user_id and not user.is_admin:
            return jsonify({'error': 'Permission denied'}), 403
        
        db.session.delete(issue)
        db.session.commit()
        
        return jsonify({'message': 'Issue deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete issue'}), 500
