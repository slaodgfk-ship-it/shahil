from flask import Blueprint, request, jsonify, session
from models import Order, OrderItem, User, db
from decimal import Decimal

cafeteria_bp = Blueprint('cafeteria', __name__)

# Menu items (in a real app, this would be in the database)
MENU_ITEMS = {
    'Chicken Burger': {'price': 40, 'category': 'Main Course'},
    'Margherita Pizza': {'price': 120, 'category': 'Main Course'},
    'Club Sandwich': {'price': 40, 'category': 'Main Course'},
    'Coffee': {'price': 30, 'category': 'Beverages'},
    'Tea': {'price': 20, 'category': 'Beverages'}
}

def require_auth(f):
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@cafeteria_bp.route('/menu', methods=['GET'])
def get_menu():
    return jsonify({'menu': MENU_ITEMS}), 200

@cafeteria_bp.route('/orders', methods=['POST'])
@require_auth
def place_order():
    try:
        data = request.get_json()
        
        if not data.get('items') or not isinstance(data['items'], list):
            return jsonify({'error': 'Items list is required'}), 400
        
        user_id = session['user_id']
        total_amount = Decimal('0.00')
        order_items = []
        
        # Validate and calculate total
        for item in data['items']:
            item_name = item.get('name')
            quantity = item.get('quantity', 1)
            
            if item_name not in MENU_ITEMS:
                return jsonify({'error': f'Invalid item: {item_name}'}), 400
            
            if quantity <= 0:
                return jsonify({'error': 'Quantity must be greater than 0'}), 400
            
            price = Decimal(str(MENU_ITEMS[item_name]['price']))
            subtotal = price * quantity
            total_amount += subtotal
            
            order_items.append({
                'item_name': item_name,
                'quantity': quantity,
                'price': price
            })
        
        # Create order
        order = Order(
            user_id=user_id,
            total_amount=total_amount,
            status='Pending'
        )
        
        db.session.add(order)
        db.session.flush()  # Get the order ID
        
        # Create order items
        for item_data in order_items:
            order_item = OrderItem(
                order_id=order.id,
                item_name=item_data['item_name'],
                quantity=item_data['quantity'],
                price=item_data['price']
            )
            db.session.add(order_item)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Order placed successfully',
            'order': order.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to place order'}), 500

@cafeteria_bp.route('/orders', methods=['GET'])
@require_auth
def get_user_orders():
    try:
        user_id = session['user_id']
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        orders = Order.query.filter_by(user_id=user_id)\
                          .order_by(Order.created_at.desc())\
                          .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'orders': [order.to_dict() for order in orders.items],
            'pagination': {
                'page': orders.page,
                'pages': orders.pages,
                'per_page': orders.per_page,
                'total': orders.total,
                'has_next': orders.has_next,
                'has_prev': orders.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve orders'}), 500

@cafeteria_bp.route('/orders/<int:order_id>', methods=['GET'])
@require_auth
def get_order(order_id):
    try:
        user_id = session['user_id']
        order = Order.query.filter_by(id=order_id, user_id=user_id).first()
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        return jsonify({'order': order.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve order'}), 500

@cafeteria_bp.route('/orders/<int:order_id>/cancel', methods=['PUT'])
@require_auth
def cancel_order(order_id):
    try:
        user_id = session['user_id']
        order = Order.query.filter_by(id=order_id, user_id=user_id).first()
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        if order.status != 'Pending':
            return jsonify({'error': 'Cannot cancel order that is not pending'}), 400
        
        order.status = 'Cancelled'
        db.session.commit()
        
        return jsonify({
            'message': 'Order cancelled successfully',
            'order': order.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to cancel order'}), 500

# Admin routes for managing orders
@cafeteria_bp.route('/admin/orders', methods=['GET'])
@require_auth
def get_all_orders():
    try:
        # Check if user is admin
        user = User.query.get(session['user_id'])
        if not user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        
        query = Order.query
        if status:
            query = query.filter_by(status=status)
        
        orders = query.order_by(Order.created_at.desc())\
                     .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'orders': [order.to_dict() for order in orders.items],
            'pagination': {
                'page': orders.page,
                'pages': orders.pages,
                'per_page': orders.per_page,
                'total': orders.total,
                'has_next': orders.has_next,
                'has_prev': orders.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve orders'}), 500

@cafeteria_bp.route('/admin/orders/<int:order_id>/status', methods=['PUT'])
@require_auth
def update_order_status(order_id):
    try:
        # Check if user is admin
        user = User.query.get(session['user_id'])
        if not user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status not in ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled']:
            return jsonify({'error': 'Invalid status'}), 400
        
        order = Order.query.get(order_id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        order.status = new_status
        db.session.commit()
        
        return jsonify({
            'message': 'Order status updated successfully',
            'order': order.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update order status'}), 500
