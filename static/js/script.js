// Select the mic button element
const micButton = document.getElementById('activate-voice-assistant');
const voices = [];

// Define the numberMap variable
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
function startVoiceRecognition() {
    micButton.classList.add('active'); // Add 'active' class to mic button to change its color

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-IN';  // Set language to English (India)
    recognition.interimResults = false;
    recognition.continuous = false;  // Stop continuous recognition to reduce noise pickup

    // When voice recognition produces a result
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript.toLowerCase();
        processOrder(transcript);
        micButton.classList.remove('active'); // Remove 'active' class after voice recognition finishes
    };

    // Handle errors (e.g., if user cancels voice recognition)
    recognition.onerror = function(event) {
        console.error('Voice recognition error:', event.error);
        micButton.classList.remove('active'); // Remove 'active' class if there is an error
    };

    recognition.onend = function() {
        micButton.classList.remove('active'); // Remove 'active' class when voice recognition ends
    };

    // Start the speech recognition process 
    recognition.start();
}

// Update chat with messages
function updateChat(sender, message) {
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

    let matchedItem = null;
    let quantity = 1; // Default to 1

    // Print user's voice input
    updateChat('user', transcript);

    // Check if the transcript contains an item for ordering
    for (const item in items) {
        if (transcript.includes(item)) {
            matchedItem = item;
            break;
        }
    }

    // Check for quantity in transcript (supports both numeric and word-based quantities)
    const qtyMatch = transcript.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i);
    if (qtyMatch) {
        const quantityStr = qtyMatch[0].toLowerCase();
        quantity = isNaN(quantityStr) ? numberMap[quantityStr] : parseInt(quantityStr); // Convert to number
    }

    // Greetings
    const greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"];
    if (greetings.some(greet => transcript.includes(greet))) {
        updateChat('app', "Hello, Order something you like!");
        return; // Exit the function after greeting response
    }

    // Check if user finalizes the order
    if (transcript.includes("finalize") || 
    transcript.includes("final") || 
    transcript.includes("enough") || 
    transcript.includes("that's all") || 
    transcript.includes("finish the order") || 
    transcript.includes("confirm the order") || 
    transcript.includes("wrap it up") || 
    transcript.includes("that's it")) {

        // Check if there are items in the order list before finalizing
        if (document.querySelectorAll('#order-items tr').length === 0) {
            updateChat('app', "Please order something before finalizing.");
        } else {
            finalizeOrder();
            micButton.classList.remove('active');  // Stop mic after finalizing the order
        }

        return;
    }  
    // Check if user wants to remove items
    if (transcript.includes("remove")) {
        const removeMatch = transcript.match(/remove (\d+|one|two|three|four|five|six|seven|eight|nine|ten)?\s*(.*)/);
        if (removeMatch) {
            const removeQtyStr = removeMatch[1] ? removeMatch[1].toLowerCase() : 'one';
            const removeItem = removeMatch[2].toLowerCase();
            const removeQuantity = isNaN(removeQtyStr) ? numberMap[removeQtyStr] : parseInt(removeQtyStr);

            removeItemFromOrder(removeItem, removeQuantity);
        }
        return;
    }

    if (matchedItem) {
        addToOrder(matchedItem, quantity, items[matchedItem]);
        updateChat('app', `${quantity} ${matchedItem}${quantity > 1 ? 's' : ''} added to your order.`);
        
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
    const totalMessage = document.createElement('div');
    totalMessage.classList.add('app');
    totalMessage.innerText = `Total Amount: ₹${total}`;
    document.getElementById('chat').appendChild(totalMessage);

    // Speak the total amount
    speakText(`Your Orders on the way...`)
    
    generateQRCode(total);
}

function generateQRCode(total) {
    const upiID = "9025370065@ybl";  // Replace with your UPI ID
    const payeeName = "KOVAI KULAMBI";  // Replace with the payee name
    const upiLink = `upi://pay?pa=${upiID}&pn=${payeeName}&mc=1234&tid=transactionId&am=${total}&cu=INR&url=https://your-merchant-website.com`; // Transaction details

    // Clear previous QR code
    const qrContainer = document.getElementById("qrCodeContainer");
    qrContainer.innerHTML = ""; // Clear previous QR code, if any

    // Create a canvas element for the QR code
    const canvas = document.createElement("canvas");
    qrContainer.appendChild(canvas);

    // Generate new QR code on the canvas
    QRCode.toCanvas(canvas, upiLink, function (error) {
        if (error) console.error(error);
        console.log("QR Code generated!");
    });
}
