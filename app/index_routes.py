from flask import Blueprint, request, jsonify
from database import get_db_connection
from utils import extract_items
from datetime import datetime

index_bp = Blueprint('index', __name__)

@index_bp.route('/place_order', methods=['POST'])
def place_order():
    data = request.json
    table_number = data.get('table_number')
    items_ordered = extract_items(data.get('items', []))
    db = get_db_connection()
    cursor = db.cursor()

    try:
        cursor.execute("INSERT INTO Orders (TableNumber, OrderDate) VALUES (%s, %s)", (table_number, datetime.now()))
        db.commit()
        order_id = cursor.lastrowid
        total_amount = 0

        for item in items_ordered:
            cursor.execute("SELECT ItemID, Price FROM Items WHERE ItemName = %s", (item['item_name'],))
            item_info = cursor.fetchone()
            if item_info:
                item_id, price = item_info
                quantity = item['quantity']
                cursor.execute("INSERT INTO OrderItems (OrderID, ItemID, Quantity) VALUES (%s, %s, %s)",
                               (order_id, item_id, quantity))
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
