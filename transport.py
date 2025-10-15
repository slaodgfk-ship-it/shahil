from flask import Blueprint, request, jsonify, session
from models import Ride, RideBooking, User, db
from datetime import datetime
from decimal import Decimal

transport_bp = Blueprint('transport', __name__)

def require_auth(f):
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@transport_bp.route('/rides', methods=['POST'])
@require_auth
def offer_ride():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['from_location', 'to_location', 'departure_time', 'total_seats', 'price_per_person']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Validate departure time
        try:
            departure_time = datetime.fromisoformat(data['departure_time'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Invalid departure time format'}), 400
        
        # Check if departure time is in the future
        if departure_time <= datetime.utcnow():
            return jsonify({'error': 'Departure time must be in the future'}), 400
        
        # Validate seats and price
        total_seats = data['total_seats']
        price_per_person = data['price_per_person']
        
        if total_seats <= 0 or total_seats > 8:
            return jsonify({'error': 'Total seats must be between 1 and 8'}), 400
        
        if price_per_person < 0:
            return jsonify({'error': 'Price cannot be negative'}), 400
        
        user_id = session['user_id']
        
        ride = Ride(
            driver_id=user_id,
            from_location=data['from_location'].strip(),
            to_location=data['to_location'].strip(),
            departure_time=departure_time,
            total_seats=total_seats,
            available_seats=total_seats,
            price_per_person=Decimal(str(price_per_person)),
            status='Active'
        )
        
        db.session.add(ride)
        db.session.commit()
        
        return jsonify({
            'message': 'Ride offered successfully',
            'ride': ride.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to offer ride'}), 500

@transport_bp.route('/rides', methods=['GET'])
def get_rides():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        from_location = request.args.get('from')
        to_location = request.args.get('to')
        date = request.args.get('date')
        
        query = Ride.query.filter_by(status='Active')\
                         .filter(Ride.available_seats > 0)\
                         .filter(Ride.departure_time > datetime.utcnow())
        
        if from_location:
            query = query.filter(Ride.from_location.ilike(f'%{from_location}%'))
        
        if to_location:
            query = query.filter(Ride.to_location.ilike(f'%{to_location}%'))
        
        if date:
            try:
                search_date = datetime.fromisoformat(date).date()
                query = query.filter(db.func.date(Ride.departure_time) == search_date)
            except ValueError:
                return jsonify({'error': 'Invalid date format'}), 400
        
        rides = query.order_by(Ride.departure_time)\
                    .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'rides': [ride.to_dict() for ride in rides.items],
            'pagination': {
                'page': rides.page,
                'pages': rides.pages,
                'per_page': rides.per_page,
                'total': rides.total,
                'has_next': rides.has_next,
                'has_prev': rides.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve rides'}), 500

@transport_bp.route('/rides/my', methods=['GET'])
@require_auth
def get_my_rides():
    try:
        user_id = session['user_id']
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        rides = Ride.query.filter_by(driver_id=user_id)\
                         .order_by(Ride.departure_time.desc())\
                         .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'rides': [ride.to_dict() for ride in rides.items],
            'pagination': {
                'page': rides.page,
                'pages': rides.pages,
                'per_page': rides.per_page,
                'total': rides.total,
                'has_next': rides.has_next,
                'has_prev': rides.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve rides'}), 500

@transport_bp.route('/rides/<int:ride_id>', methods=['GET'])
def get_ride(ride_id):
    try:
        ride = Ride.query.get(ride_id)
        
        if not ride:
            return jsonify({'error': 'Ride not found'}), 404
        
        return jsonify({'ride': ride.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve ride'}), 500

@transport_bp.route('/rides/<int:ride_id>/book', methods=['POST'])
@require_auth
def book_ride(ride_id):
    try:
        user_id = session['user_id']
        
        ride = Ride.query.get(ride_id)
        if not ride:
            return jsonify({'error': 'Ride not found'}), 404
        
        # Check if user is trying to book their own ride
        if ride.driver_id == user_id:
            return jsonify({'error': 'Cannot book your own ride'}), 400
        
        # Check if ride is still active and has available seats
        if ride.status != 'Active':
            return jsonify({'error': 'Ride is not available'}), 400
        
        if ride.available_seats <= 0:
            return jsonify({'error': 'No available seats'}), 400
        
        # Check if departure time is still in the future
        if ride.departure_time <= datetime.utcnow():
            return jsonify({'error': 'Ride has already departed'}), 400
        
        # Check if user has already booked this ride
        existing_booking = RideBooking.query.filter_by(
            ride_id=ride_id, 
            passenger_id=user_id,
            status='Confirmed'
        ).first()
        
        if existing_booking:
            return jsonify({'error': 'You have already booked this ride'}), 400
        
        # Create booking
        booking = RideBooking(
            ride_id=ride_id,
            passenger_id=user_id,
            status='Confirmed'
        )
        
        # Update available seats
        ride.available_seats -= 1
        
        db.session.add(booking)
        db.session.commit()
        
        return jsonify({
            'message': 'Ride booked successfully',
            'booking': booking.to_dict(),
            'ride': ride.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to book ride'}), 500

@transport_bp.route('/bookings/my', methods=['GET'])
@require_auth
def get_my_bookings():
    try:
        user_id = session['user_id']
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        bookings = RideBooking.query.filter_by(passenger_id=user_id)\
                                  .order_by(RideBooking.booked_at.desc())\
                                  .paginate(page=page, per_page=per_page, error_out=False)
        
        booking_data = []
        for booking in bookings.items:
            booking_dict = booking.to_dict()
            booking_dict['ride'] = booking.ride.to_dict()
            booking_data.append(booking_dict)
        
        return jsonify({
            'bookings': booking_data,
            'pagination': {
                'page': bookings.page,
                'pages': bookings.pages,
                'per_page': bookings.per_page,
                'total': bookings.total,
                'has_next': bookings.has_next,
                'has_prev': bookings.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve bookings'}), 500

@transport_bp.route('/bookings/<int:booking_id>/cancel', methods=['PUT'])
@require_auth
def cancel_booking(booking_id):
    try:
        user_id = session['user_id']
        
        booking = RideBooking.query.filter_by(id=booking_id, passenger_id=user_id).first()
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        if booking.status != 'Confirmed':
            return jsonify({'error': 'Booking cannot be cancelled'}), 400
        
        # Check if ride hasn't departed yet
        if booking.ride.departure_time <= datetime.utcnow():
            return jsonify({'error': 'Cannot cancel booking for departed ride'}), 400
        
        # Cancel booking and restore seat
        booking.status = 'Cancelled'
        booking.ride.available_seats += 1
        
        db.session.commit()
        
        return jsonify({
            'message': 'Booking cancelled successfully',
            'booking': booking.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to cancel booking'}), 500

@transport_bp.route('/rides/<int:ride_id>/cancel', methods=['PUT'])
@require_auth
def cancel_ride(ride_id):
    try:
        user_id = session['user_id']
        
        ride = Ride.query.filter_by(id=ride_id, driver_id=user_id).first()
        if not ride:
            return jsonify({'error': 'Ride not found or access denied'}), 404
        
        if ride.status != 'Active':
            return jsonify({'error': 'Ride cannot be cancelled'}), 400
        
        # Check if ride hasn't departed yet
        if ride.departure_time <= datetime.utcnow():
            return jsonify({'error': 'Cannot cancel ride that has already departed'}), 400
        
        # Cancel ride and all associated bookings
        ride.status = 'Cancelled'
        
        # Cancel all confirmed bookings for this ride
        RideBooking.query.filter_by(ride_id=ride_id, status='Confirmed')\
                        .update({'status': 'Cancelled'})
        
        db.session.commit()
        
        return jsonify({
            'message': 'Ride cancelled successfully',
            'ride': ride.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to cancel ride'}), 500

@transport_bp.route('/stats', methods=['GET'])
def get_transport_stats():
    try:
        total_rides = Ride.query.count()
        active_rides = Ride.query.filter_by(status='Active')\
                                .filter(Ride.departure_time > datetime.utcnow())\
                                .count()
        total_bookings = RideBooking.query.filter_by(status='Confirmed').count()
        
        return jsonify({
            'total_rides': total_rides,
            'active_rides': active_rides,
            'total_bookings': total_bookings
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve statistics'}), 500
