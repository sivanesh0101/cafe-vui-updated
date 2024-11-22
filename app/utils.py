from datetime import datetime

def extract_items(order_items):
    items = []
    for item in order_items:
        item_name = item['item_name']
        quantity = item['quantity']
        items.append({"item_name": item_name, "quantity": quantity})
    return items

def format_date(date_obj):
    return date_obj.strftime("%Y-%m-%d %H:%M:%S")
