// Select the mic button element
const micButton = document.getElementById('activate-voice-assistant');
const voices = [];




// Load available voices
window.speechSynthesis.onvoiceschanged = function() {
    voices.length = 0; // Clear existing voices
    voices.push(...window.speechSynthesis.getVoices()); // Load available voices
};

// Function to convert text to speech
function speakText(text, rate = 1.2) {  // Default rate set to 1
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN'; // Use Indian English
    utterance.rate = rate; // Set the speech rate

    // Look for Microsoft Zira voice
    const ziraVoice = voices.find(voice => voice.name.toLowerCase().includes("zira"));
    if (ziraVoice) {
        utterance.voice = ziraVoice; // Set Zira as the voice
    }

    // Speak the text
    window.speechSynthesis.speak(utterance);
}

// Function to start voice recognition
let recognition; // Declare the recognition variable globally
let isRecognitionActive = false; // Track whether recognition is active

function startVoiceRecognition() {
    if (!recognition) {
        // Initialize recognition if not already initialized
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'en-IN'; // Set language to English (India)
        recognition.interimResults = false;
        recognition.continuous = false; // Stop continuous recognition to reduce noise pickup

        // When voice recognition produces a result
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript.toLowerCase();
            processOrder(transcript);
            stopVoiceRecognition(); // Stop recognition after processing
        };

        // Handle errors (e.g., if user cancels voice recognition)
        recognition.onerror = function(event) {
            console.error('Voice recognition error:', event.error);
            stopVoiceRecognition(); // Stop recognition on error
        };

        recognition.onend = function() {
            stopVoiceRecognition(); // Ensure cleanup when recognition ends
        };
    }

    if (isRecognitionActive) {
        // If recognition is already active, stop it
        stopVoiceRecognition();
    } else {
        // If recognition is not active, start it
        micButton.classList.add('active'); // Add 'active' class to mic button to change its color
        recognition.start();
        isRecognitionActive = true; // Update the state
    }
}

function stopVoiceRecognition() {
    if (recognition) {
        recognition.stop(); // Stop recognition if it's active
    }
    micButton.classList.remove('active'); // Remove 'active' class
    isRecognitionActive = false; // Update the state
}

// Update chat with messages
function updateChat(sender, message) {
    // If the sender is the user, replace "for" with "four"
    if (sender === 'user') {
        message = message.replace(/\bfor\b/g, 'four');
    }

    const chatMessage = document.createElement('div');
    chatMessage.classList.add(sender);
    chatMessage.innerText = message;
    document.getElementById('chat').appendChild(chatMessage);
    const chatContainer = document.getElementById('chat');
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Speak the message out loud only if it's from the app, not the user
    if (sender !== 'user') {
        speakText(message);
    }
}


// Process the voice command for ordering and removing items
function processOrder(transcript) {
    const items = {
        "cappuccino": 50, 
        "espresso": 60, 
        "cold coffee": 120, 
        "cold mocha": 150, 
        "red velvet cake": 415,
        "filter coffee": 70, 
        "flat white": 40,
        "belgian chocolate": 180,
        "chocolate shake": 200,
        "sandwich": 70,
        "garlic bread": 60,
        "veg burger": 120,
        "veg pizza": 150,
        "cheesecake": 165,
        "vanilla scoop": 165,
        "strawberry cake": 165 
    };

    const numberMap = {
        "one": 1,
        "two": 2,
        "three": 3,
        "four": 4,
        "five": 5,
        "six": 6,
        "seven": 7,
        "eight": 8,
        "nine": 9,
        "ten": 10
    };

    // Print user's voice input
    updateChat('user', transcript);

    // Parse transcript for multiple orders
    const orderRegex = new RegExp(`(\\b(?:${Object.keys(numberMap).join('|')}|\\d+)\\b)?\\s*(\\b${Object.keys(items).join('\\b|\\b')}\\b)`, 'gi');
    const orders = [...transcript.matchAll(orderRegex)];

    // Greetings
    const greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"];
    if (greetings.some(greet => transcript.toLowerCase().includes(greet))) {
        updateChat('app', "Hello! Order something you like.");
        return;
    }

    // Finalize order
    if (
        transcript.toLowerCase().includes("finalize") || 
        transcript.toLowerCase().includes("final") || 
        transcript.toLowerCase().includes("enough") || 
        transcript.toLowerCase().includes("that's all") || 
        transcript.toLowerCase().includes("finish the order") || 
        transcript.toLowerCase().includes("confirm the order") || 
        transcript.toLowerCase().includes("wrap it up") || 
        transcript.toLowerCase().includes("that's it")
    ) {
        finalizeOrder();
        return;
    }

    // Handle order cancellation
    if (
        transcript.toLowerCase().includes("cancel the order") ||
        transcript.toLowerCase().includes("cancel order") ||
        transcript.toLowerCase().includes("remove all items") ||
        transcript.toLowerCase().includes("clear the order") ||
        transcript.toLowerCase().includes("discard the order")
    ) {
        clearOrder();
        updateChat('app', "All items have been removed from your order.");
        
        // Refresh the page after clearing the order
        setTimeout(() => {
            window.location.reload();  // This will reload the page after clearing the order
        }, 500); // Adding a delay before refresh to ensure the order is cleared first
        return;
    }

    // Remove items
    if (transcript.toLowerCase().includes("remove")) {
        const removeMatch = transcript.match(/remove (\d+|one|two|three|four|five|six|seven|eight|nine|ten)?\s*(.*)/i);
        if (removeMatch) {
            const removeQtyStr = removeMatch[1] ? removeMatch[1].toLowerCase() : "one";
            const removeItem = removeMatch[2].toLowerCase();
            const removeQuantity = isNaN(removeQtyStr) ? numberMap[removeQtyStr] : parseInt(removeQtyStr);

            removeItemFromOrder(removeItem, removeQuantity);
        } else {
            updateChat('app', "Please specify the item and quantity to remove.");
        }
        return;
    }

    // Handle orders
    if (orders.length > 0) {
        orders.forEach(order => {
            let quantityStr = order[1] ? order[1].toLowerCase() : "one";
            const item = order[2].toLowerCase();

            // Normalize quantity
            if (quantityStr === "for") quantityStr = "four";
            if (quantityStr === "on") quantityStr = "one";
            if (quantityStr === "to") quantityStr = "two";
            const quantity = isNaN(quantityStr) ? numberMap[quantityStr] : parseInt(quantity);

            if (items[item]) {
                addToOrder(item, quantity, items[item]);
                updateChat('app', `${quantity} ${item}${quantity > 1 ? 's' : ''} added to your order.`);
            } else {
                updateChat('app', `Sorry, ${item} is not available.`);
            }
        });

        // Prompt for additional orders
        const additionalPrompts = [
            "Anything else?",
            "Anything more you'd like?",
            "Can I get you anything else?",
            "Shall I add something else to your order?",
            "Would you like something more with that?"
        ];
        const randomPrompt = additionalPrompts[Math.floor(Math.random() * additionalPrompts.length)];
        updateChat('app', randomPrompt);
    } else {
        updateChat('app', "Oops, it's not available.");
    }
}

// Function to clear all items from the order
// Track if the order is finalized
let isOrderFinalized = false; // Default state, change when the order is finalized

function clearOrder(orderId) {
    if (isOrderFinalized) {
        // If the order is finalized, call the backend route to cancel it
        if (!orderId) {
            updateChat('app', "Order ID is required to clear the finalized order.");
            return;
        }

        fetch('http://127.0.0.1:5000/cancel_order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ order_id: orderId }) // Send the order ID in the request body
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network error: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                updateChat('app', `Error clearing finalized order: ${data.error}`);
            } else {
                updateChat('app', data.message); // Display success message
                // Clear the order items in the UI
                const orderItems = document.getElementById('order-items');
                orderItems.innerHTML = ''; // Clear all rows from the order table
                updateChat('app', "Your finalized order has been canceled successfully.");
                isOrderFinalized = false; // Reset the finalized state
            }
        })
        .catch(error => {
            console.error('Error:', error);
            updateChat('app', "An error occurred while clearing the finalized order. Please try again.");
        });
    } else {
        // If the order is not finalized, just clear the UI
        const orderItems = document.getElementById('order-items');
        orderItems.innerHTML = ''; // Clear all rows from the order table
        updateChat('app', "Your order has been cleared.");
    }
}




function removeItemFromOrderClick(iconElement) {
    const row = iconElement.closest('tr');  // Ensure it targets the parent row
    if (!row) {
        console.error('Row not found');
        return;
    }
    
    const itemName = row.cells[0].innerText.trim();
    const quantity = parseInt(row.cells[1].innerText.trim());
    
    if (itemName && quantity) {
        removeItemFromOrder(itemName, quantity);  // Call removeItemFromOrder
        row.remove();  // Remove the row from the table after removing the item
    } else {
        console.error('Invalid row data', itemName, quantity);
    }
}
// Remove item from order display
function removeItemFromOrder(itemName, quantity) {
    const orderItems = document.getElementById('order-items');
    let existingRow = Array.from(orderItems.rows).find(row => row.cells[0].innerText.toLowerCase() === itemName.toLowerCase());

    if (existingRow) {
        const quantityCell = existingRow.cells[1];
        const priceCell = existingRow.cells[2];
        const currentQty = parseInt(quantityCell.innerText);

        // If quantity matches or exceeds, remove the item
        if (currentQty >= quantity) {
            const newQty = currentQty - quantity;
            if (newQty > 0) {
                // Update the quantity and price
                quantityCell.innerText = newQty;
                priceCell.innerText = newQty * parseInt(priceCell.innerText) / currentQty;
            } else {
                // Remove the row entirely if quantity reaches zero
                existingRow.remove();
            }
            updateChat('app', `${quantity} ${itemName}${quantity > 1 ? 's' : ''} removed from your order.`);
        } else {
            updateChat('app', `You only have ${currentQty} ${itemName}${quantity > 1 ? 's' : ''} in your order.`);
        }
    } else {
        updateChat('app', `No ${itemName}s found in your order.`);
    }
}
// Add item to order display
function addToOrder(itemName, quantity, price) {
    const orderItems = document.getElementById('order-items');
    let existingRow = Array.from(orderItems.rows).find(row => row.cells[0].innerText === itemName);

    if (existingRow) {
        // Item exists: update the quantity and total price
        const quantityCell = existingRow.cells[1];
        const priceCell = existingRow.cells[2];
        const currentQty = parseInt(quantityCell.innerText);
        const newQty = currentQty + quantity;
        quantityCell.innerText = newQty;
        priceCell.innerText = newQty * price;
    } else {
        // Item doesn't exist: create a new row
        const orderItem = document.createElement('tr');
        orderItem.innerHTML = `<td>${itemName}</td>
            <td>${quantity}</td>
            <td>${price * quantity}</td>
            <td><i class="fas fa-trash-alt" style="cursor: pointer;" onclick="removeItemFromOrderClick(this)"></i></td>`;
        orderItems.appendChild(orderItem);
    }
}

// Finalize the order and send to the server
function finalizeOrder() {
    const orderItems = [];
    let totalAmount = 0;

    document.querySelectorAll('#order-items tr').forEach(row => {
        const item = row.querySelector('td:first-child').innerText;
        const quantity = row.querySelector('td:nth-child(2)').innerText;
        const price = parseInt(row.querySelector('td:nth-child(3)').innerText);
        orderItems.push({ item_name: item, quantity: parseInt(quantity) });
        totalAmount += price; // Sum up the total amount
    });

    // Check if total amount is 0
    if (totalAmount === 0) {
        updateChat('app', "Please Order something!");
        return; // Stop execution if no items have been ordered
    }

    fetch('http://127.0.0.1:5000/place_order', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ table_number: 1, items: orderItems })
    }) 
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok " + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        updateChat('app', "Your order has been placed successfully!");
        console.log(data);
        
        // Display total amount (without QR code generation)
        displayTotalAmount(totalAmount);
    })
    .catch(error => {
        // Handle any network errors (but not QR generation errors)
        updateChat('app', "Sorry, there was an issue with your order.");
        console.error(error);
    });
}


// Display total amount without generating QR code
function displayTotalAmount(total) {
    const totalPriceContainer = document.getElementById('totalPrice');
    
    // Clear previous total amount
    totalPriceContainer.innerHTML = ""; 

    // Create and append the new total amount
    const totalMessage = document.createElement('div');
    totalMessage.innerText = `₹${total}`;
    totalPriceContainer.appendChild(totalMessage);

    // Speak the total amount
    speakText(`Your Orders on the way...`);
    
    // Generate the QR code for the total amount
    generateQRCode(total);
}

function cancelOrder() {
    const totalPriceContainer = document.getElementById('cancelOrder');
}


function generateQRCode(total) {
    const upiID = "9025370065@ybl"; // Replace with your UPI ID
    const payeeName = "KOVAI KULAMBI"; // Replace with the payee name
    const upiLink = `upi://pay?pa=${upiID}&pn=${payeeName}&mc=1234&tid=transactionId&am=${total}&cu=INR&url=https://your-merchant-website.com`; // Transaction details

    // Clear previous QR code
    const qrContainer = document.getElementById("qrCodeContainer");
    qrContainer.innerHTML = ""; // Clear previous QR code, if any

    // Create a canvas element for the QR code
    const canvas = document.createElement("canvas");
    qrContainer.appendChild(canvas);

    // Generate new QR code on the canvas
    QRCode.toCanvas(canvas, upiLink, function (error) {
        if (error) {
            console.error(error);
        } else {
            console.log("QR Code generated!");

            // Scroll the order section into view
            const orderSection = document.getElementById("order-section"); // Replace with your section's ID
            if (orderSection) {
                orderSection.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    });
}
