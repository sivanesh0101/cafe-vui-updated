document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('orders-table-body');

    // Fetch orders from the API
    fetch('http://127.0.0.1:5000/all_orders')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Clear any existing rows in the table
            tableBody.innerHTML = '';

            // Populate the table with data
            data.forEach(order => {
                const orderRow = document.createElement('tr');

                // Order Details (Order ID)
                const orderDetailsCell = document.createElement('td');
                orderDetailsCell.textContent = order.order_id;
                orderRow.appendChild(orderDetailsCell);

                // Table Number
                const tableNumberCell = document.createElement('td');
                tableNumberCell.textContent = order.table_number;
                orderRow.appendChild(tableNumberCell);

                // Order Date
                const orderDateCell = document.createElement('td');
                orderDateCell.textContent = order.order_date;
                orderRow.appendChild(orderDateCell);

                // Items - Map items to a list
                const itemsCell = document.createElement('td');
                const itemsList = document.createElement('ul');
                order.items.forEach(item => {
                    const itemLi = document.createElement('li');
                    itemLi.textContent = `${item.item_name} - Quantity: ${item.quantity}, Price: $${item.price}, Total: $${item.total}`;
                    itemsList.appendChild(itemLi);
                });
                itemsCell.appendChild(itemsList);
                orderRow.appendChild(itemsCell);

                // Total Amount - Ensure it's a number and format it
                const totalAmountCell = document.createElement('td');
                const totalAmount = parseFloat(order.total_amount);
                if (!isNaN(totalAmount)) {
                    totalAmountCell.textContent = `$${totalAmount.toFixed(2)}`;
                } else {
                    totalAmountCell.textContent = '$0.00'; // Fallback if it's not a valid number
                }
                orderRow.appendChild(totalAmountCell);

                // Append row to the table
                tableBody.appendChild(orderRow);
            });
        })
        .catch(error => {
            console.error('Error fetching orders:', error);
            const errorRow = document.createElement('tr');
            const errorCell = document.createElement('td');
            errorCell.setAttribute('colspan', 5); // Set colspan to cover all table columns
            errorCell.textContent = 'Failed to fetch orders. Please try again later.';
            errorCell.style.textAlign = 'center';
            errorCell.style.color = 'red';
            errorRow.appendChild(errorCell);
            tableBody.appendChild(errorRow);
        });
});
