from flask import Blueprint, request, jsonify
from database import get_db_connection
from utils import extract_items
from datetime import datetime

index_bp = Blueprint('index', __name__)

@index_bp.route('/place_order', methods=['POST'])
def place_order():
    data = request.json
    session_id = data.get('session_id')  # Retrieve session ID
    table_number = data.get('table_number')
    items_ordered = extract_items(data.get('items', []))

    if not session_id or not items_ordered:
        return jsonify({"error": "Session ID and items are required"}), 400

    db = get_db_connection()
    cursor = db.cursor()

    try:
        # Insert order with session ID
        cursor.execute(
            "INSERT INTO Orders (SessionID, TableNumber, OrderDate) VALUES (%s, %s, %s)",
            (session_id, table_number, datetime.now())
        )
        db.commit()
        order_id = cursor.lastrowid

        total_amount = 0
        for item in items_ordered:
            cursor.execute("SELECT ItemID, Price FROM Items WHERE ItemName = %s", (item['item_name'],))
            item_info = cursor.fetchone()
            if item_info:
                item_id, price = item_info
                quantity = item['quantity']
                cursor.execute(
                    "INSERT INTO OrderItems (OrderID, ItemID, Quantity) VALUES (%s, %s, %s)",
                    (order_id, item_id, quantity)
                )
                total_amount += price * quantity
            else:
                return jsonify({"error": f"Item '{item['item_name']}' not found"}), 404

        cursor.execute("UPDATE Orders SET TotalAmount = %s WHERE OrderID = %s", (total_amount, order_id))
        db.commit()

        return jsonify({"message": "Order placed successfully!", "order_id": order_id})

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


# New endpoint for canceling an order
@index_bp.route('/cancel_order', methods=['POST'])
def cancel_order():
    data = request.json
    session_id = data.get('session_id')  # Retrieve session ID from the request

    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400

    db = get_db_connection()
    cursor = db.cursor()

    try:
        # Fetch the order details where SessionID matches the provided session_id
        cursor.execute("""
            SELECT OrderID, status
            FROM Orders
            WHERE SessionID = %s
        """, (session_id,))
        result = cursor.fetchone()

        if not result:
            return jsonify({"error": "No order found for this session ID"}), 404

        order_id, order_status = result

        # Check if the order status is 'placed'
        if order_status != 'placed':
            return jsonify({"error": "Order cannot be canceled because it's not in 'placed' status."}), 400

        # Proceed to cancel the order if it's in 'placed' status
        cursor.execute("DELETE FROM OrderItems WHERE OrderID = %s", (order_id,))
        cursor.execute("DELETE FROM Orders WHERE OrderID = %s", (order_id,))
        db.commit()

        # Simply return success without a message
        return jsonify({"success": True}), 200

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
