from flask import Blueprint, jsonify, request
from database import get_db_connection

kitchen_bp = Blueprint('kitchen', __name__)

@kitchen_bp.route('/orders/<status>', methods=['GET'])
def get_orders_by_status(status):
    db = get_db_connection()
    cursor = db.cursor()
    try:
        cursor.execute("""
            SELECT o.OrderID, o.TableNumber, o.OrderDate, oi.ItemID, i.ItemName, oi.Quantity, i.Price 
            FROM Orders o 
            JOIN OrderItems oi ON o.OrderID = oi.OrderID 
            JOIN Items i ON oi.ItemID = i.ItemID 
            WHERE o.status = %s
            ORDER BY o.OrderDate DESC
        """, (status,))

        orders = cursor.fetchall()
        order_dict = {}

        for order in orders:
            order_id, table_number, order_date, item_id, item_name, quantity, price = order
            if order_id not in order_dict:
                order_dict[order_id] = {
                    "order_id": order_id,
                    "table_number": table_number,
                    "order_date": order_date.strftime("%Y-%m-%d %H:%M:%S"),
                    "items": [],
                    "total_amount": 0
                }
            order_dict[order_id]["items"].append({
                "item_name": item_name,
                "quantity": quantity,
                "price": price,
                "total": quantity * price
            })
            order_dict[order_id]["total_amount"] += quantity * price

        return jsonify(list(order_dict.values()))

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@kitchen_bp.route('/update_order_status', methods=['POST'])
def update_order_status():
    data = request.json
    order_id = data.get('order_id')
    new_status = data.get('new_status')

    db = get_db_connection()
    cursor = db.cursor()

    try:
        cursor.execute("UPDATE Orders SET status = %s WHERE OrderID = %s", (new_status, order_id))
        db.commit()
        return jsonify({"message": "Order status updated successfully."})

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
