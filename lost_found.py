from flask import Blueprint, request, jsonify, session
from models import LostFoundItem, User, db

lost_found_bp = Blueprint('lost_found', __name__)

def require_auth(f):
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@lost_found_bp.route('/items', methods=['POST'])
@require_auth
def create_item():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['type', 'name', 'description', 'location', 'contact']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Validate type
        if data['type'] not in ['lost', 'found']:
            return jsonify({'error': 'Invalid type. Must be "lost" or "found"'}), 400
        
        user_id = session['user_id']
        
        item = LostFoundItem(
            user_id=user_id,
            type=data['type'],
            name=data['name'].strip(),
            description=data['description'].strip(),
            location=data['location'].strip(),
            contact=data['contact'].strip(),
            status='Active'
        )
        
        db.session.add(item)
        db.session.commit()
        
        return jsonify({
            'message': f'{data["type"].title()} item reported successfully',
            'item': item.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create item'}), 500

@lost_found_bp.route('/items', methods=['GET'])
def get_items():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        item_type = request.args.get('type')
        status = request.args.get('status', 'Active')
        search = request.args.get('search')
        
        query = LostFoundItem.query.filter_by(status=status)
        
        if item_type and item_type in ['lost', 'found']:
            query = query.filter_by(type=item_type)
        
        if search:
            search_term = f'%{search}%'
            query = query.filter(
                db.or_(
                    LostFoundItem.name.ilike(search_term),
                    LostFoundItem.description.ilike(search_term),
                    LostFoundItem.location.ilike(search_term)
                )
            )
        
        items = query.order_by(LostFoundItem.created_at.desc())\
                    .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'items': [item.to_dict() for item in items.items],
            'pagination': {
                'page': items.page,
                'pages': items.pages,
                'per_page': items.per_page,
                'total': items.total,
                'has_next': items.has_next,
                'has_prev': items.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve items'}), 500

@lost_found_bp.route('/items/my', methods=['GET'])
@require_auth
def get_my_items():
    try:
        user_id = session['user_id']
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        item_type = request.args.get('type')
        status = request.args.get('status')
        
        query = LostFoundItem.query.filter_by(user_id=user_id)
        
        if item_type and item_type in ['lost', 'found']:
            query = query.filter_by(type=item_type)
        
        if status:
            query = query.filter_by(status=status)
        
        items = query.order_by(LostFoundItem.created_at.desc())\
                    .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'items': [item.to_dict() for item in items.items],
            'pagination': {
                'page': items.page,
                'pages': items.pages,
                'per_page': items.per_page,
                'total': items.total,
                'has_next': items.has_next,
                'has_prev': items.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve items'}), 500

@lost_found_bp.route('/items/<int:item_id>', methods=['GET'])
def get_item(item_id):
    try:
        item = LostFoundItem.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        return jsonify({'item': item.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve item'}), 500

@lost_found_bp.route('/items/<int:item_id>', methods=['PUT'])
@require_auth
def update_item(item_id):
    try:
        user_id = session['user_id']
        item = LostFoundItem.query.filter_by(id=item_id, user_id=user_id).first()
        
        if not item:
            return jsonify({'error': 'Item not found or access denied'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'name' in data:
            item.name = data['name'].strip()
        if 'description' in data:
            item.description = data['description'].strip()
        if 'location' in data:
            item.location = data['location'].strip()
        if 'contact' in data:
            item.contact = data['contact'].strip()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Item updated successfully',
            'item': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update item'}), 500

@lost_found_bp.route('/items/<int:item_id>/resolve', methods=['PUT'])
@require_auth
def resolve_item(item_id):
    try:
        user_id = session['user_id']
        user = User.query.get(user_id)
        
        item = LostFoundItem.query.get(item_id)
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        # Only allow resolution by the item owner or admin
        if item.user_id != user_id and not user.is_admin:
            return jsonify({'error': 'Permission denied'}), 403
        
        item.status = 'Resolved'
        db.session.commit()
        
        return jsonify({
            'message': 'Item marked as resolved',
            'item': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to resolve item'}), 500

@lost_found_bp.route('/items/<int:item_id>', methods=['DELETE'])
@require_auth
def delete_item(item_id):
    try:
        user_id = session['user_id']
        user = User.query.get(user_id)
        
        item = LostFoundItem.query.get(item_id)
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        # Only allow deletion by the item owner or admin
        if item.user_id != user_id and not user.is_admin:
            return jsonify({'error': 'Permission denied'}), 403
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'Item deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete item'}), 500

@lost_found_bp.route('/stats', methods=['GET'])
def get_lost_found_stats():
    try:
        total_items = LostFoundItem.query.count()
        active_items = LostFoundItem.query.filter_by(status='Active').count()
        resolved_items = LostFoundItem.query.filter_by(status='Resolved').count()
        
        lost_items = LostFoundItem.query.filter_by(type='lost', status='Active').count()
        found_items = LostFoundItem.query.filter_by(type='found', status='Active').count()
        
        return jsonify({
            'total_items': total_items,
            'active_items': active_items,
            'resolved_items': resolved_items,
            'lost_items': lost_items,
            'found_items': found_items
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve statistics'}), 500
