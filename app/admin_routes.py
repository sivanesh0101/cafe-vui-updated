from flask import Blueprint, jsonify, render_template
from database import get_db_connection

admin_blueprint = Blueprint('admin', __name__)

@admin_blueprint.route('/')
def admin():
    return render_template('admin.html')

@admin_blueprint.route('/all_orders', methods=['GET'])
def get_all_orders():from flask import Blueprint, jsonify
from database import get_db_connection
from utils import format_date

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/all_orders', methods=['GET'])
def get_all_orders():
    db = get_db_connection()
    cursor = db.cursor()

    try:
        cursor.execute("""
            SELECT o.OrderID, o.TableNumber, o.OrderDate, oi.ItemID, i.ItemName, oi.Quantity, i.Price 
            FROM Orders o 
            JOIN OrderItems oi ON o.OrderID = oi.OrderID 
            JOIN Items i ON oi.ItemID = i.ItemID 
            ORDER BY o.OrderDate DESC
        """)

        orders = cursor.fetchall()
        order_dict = {}

        for order in orders:
            order_id, table_number, order_date, item_id, item_name, quantity, price = order
            if order_id not in order_dict:
                order_dict[order_id] = {
                    "order_id": order_id,
                    "table_number": table_number,
                    "order_date": format_date(order_date),
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

    db = get_db_connection()
    cursor = db.cursor()

    try:
        cursor.execute("""
            SELECT o.OrderID, o.TableNumber, o.OrderDate, oi.ItemID, i.ItemName, oi.Quantity, i.Price 
            FROM Orders o 
            JOIN OrderItems oi ON o.OrderID = oi.OrderID 
            JOIN Items i ON oi.ItemID = i.ItemID 
            ORDER BY o.OrderDate DESC
        """)

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
