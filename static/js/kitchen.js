async function loadOrders(status) {
    const response = await fetch(`http://127.0.0.1:5000/orders/${status}`);
    if (!response.ok) {
        document.getElementById('order-details').innerText = "Error loading orders";
        return;
    }

    const orders = await response.json();
    const filteredOrders = filterTodaysOrders(orders);  // Filter orders for today only
    displayOrders(filteredOrders, status);
}

function filterTodaysOrders(orders) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Set to 00:00 of today
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)); // Set to 23:59:59 of today

    return orders.filter(order => {
        const orderDate = new Date(order.order_date);
        return orderDate >= startOfDay && orderDate <= endOfDay;  // Filter by today's date
    });
}

function displayOrders(orders, status) {
    const detailsDiv = document.getElementById('order-details');
    detailsDiv.innerHTML = ""; // Clear previous content

    if (orders.length === 0) {
        detailsDiv.innerHTML = "<p>No orders found for today.</p>";
        return;
    }

    orders.sort((a, b) => new Date(a.order_date) - new Date(b.order_date));

    orders.forEach(order => {
        const orderDiv = document.createElement('div');
        orderDiv.classList.add('order');

        let buttonHTML = '';
        if (status === 'placed') {
            buttonHTML = `<div class="clickButton"><button onclick="updateOrderStatus(${order.order_id}, 'picked')">Pick</button></div>`;
        } else if (status === 'picked') {
            buttonHTML = `<div class="clickButton"><button onclick="updateOrderStatus(${order.order_id}, 'delivered')">Deliver</button></div>`;
        }

        orderDiv.innerHTML = `<h3>Order ID: ${order.order_id}</h3>
                              <p>Table Number: ${order.table_number}</p>
                              <p>Order Date: ${order.order_date}</p>
                              <h4>Items:</h4>
                              <ul>${order.items.map(item =>
                                  `<li>${item.quantity} x ${item.item_name} - ₹ ${item.total}</li>`
                              ).join('')}</ul>
                              <h4>Total Amount: ₹ ${order.total_amount}</h4>
                              ${buttonHTML}<hr>`;

        detailsDiv.appendChild(orderDiv);
    });
}

async function updateOrderStatus(orderId, newStatus) {
    const response = await fetch('http://127.0.0.1:5000/update_order_status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order_id: orderId, new_status: newStatus })
    });

    if (response.ok) {
        loadOrders(newStatus === 'picked' ? 'placed' : 'picked');  // Reload orders for the current tab
    } else {
        console.error("Error updating order status");
    }
}

// Load 'placed' orders initially
loadOrders('placed');
