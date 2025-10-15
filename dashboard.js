// Dashboard JavaScript
let currentUser = null;
let cart = [];
let currentRating = 0;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    // Check if user is logged in
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = JSON.parse(userData);
    
    // Update welcome message
    document.getElementById('welcomeUser').textContent = `Welcome, ${currentUser.username}!`;
    
    // Initialize data
    initializeLocalData();
    
    // Load dashboard data
    loadDashboardStats();
    loadRecentActivity();
    loadMyIssues();
    loadLostFoundItems();
    loadAvailableRides();
    
    // Bind form events
    bindDashboardEvents();
}

function initializeLocalData() {
    // Initialize issues if not exists
    if (!localStorage.getItem('issues')) {
        localStorage.setItem('issues', JSON.stringify([]));
    }
    
    // Initialize feedback if not exists
    if (!localStorage.getItem('feedback')) {
        localStorage.setItem('feedback', JSON.stringify([]));
    }
    
    // Initialize orders if not exists
    if (!localStorage.getItem('orders')) {
        localStorage.setItem('orders', JSON.stringify([]));
    }
    
    // Initialize lost and found items
    if (!localStorage.getItem('lostFoundItems')) {
        localStorage.setItem('lostFoundItems', JSON.stringify([]));
    }
    
    // Initialize rides
    if (!localStorage.getItem('rides')) {
        localStorage.setItem('rides', JSON.stringify([]));
    }
}

function bindDashboardEvents() {
    // Issue form
    const issueForm = document.getElementById('issueForm');
    if (issueForm) {
        issueForm.addEventListener('submit', handleIssueSubmit);
    }
    
    // Feedback form
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', handleFeedbackSubmit);
    }
    
    // Lost item form
    const lostItemForm = document.getElementById('lostItemForm');
    if (lostItemForm) {
        lostItemForm.addEventListener('submit', handleLostItemSubmit);
    }
    
    // Found item form
    const foundItemForm = document.getElementById('foundItemForm');
    if (foundItemForm) {
        foundItemForm.addEventListener('submit', handleFoundItemSubmit);
    }
    
    // Offer ride form
    const offerRideForm = document.getElementById('offerRideForm');
    if (offerRideForm) {
        offerRideForm.addEventListener('submit', handleOfferRideSubmit);
    }
}

// Navigation functions with smooth transitions
function showSection(sectionId) {
    const currentSection = document.querySelector('.content-section.active');
    const targetSection = document.getElementById(sectionId);
    
    // If same section, do nothing
    if (currentSection === targetSection) return;
    
    // Add exit animation to current section
    if (currentSection) {
        currentSection.style.animation = 'sectionSlideOut 0.3s ease-in forwards';
        
        setTimeout(() => {
            // Hide all sections
            const sections = document.querySelectorAll('.content-section');
            sections.forEach(section => {
                section.classList.remove('active');
                section.style.animation = '';
            });
            
            // Show target section with entrance animation
            targetSection.classList.add('active');
            targetSection.style.animation = 'sectionSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards';
            
            // Update menu items
            updateMenuItems(sectionId);
        }, 300);
    } else {
        // No current section, show target immediately
        targetSection.classList.add('active');
        targetSection.style.animation = 'sectionSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards';
        updateMenuItems(sectionId);
    }
}

function updateMenuItems(sectionId) {
    // Update menu items
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => item.classList.remove('active'));
    
    // Find and activate the corresponding menu item
    const targetMenuItem = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (targetMenuItem) {
        targetMenuItem.classList.add('active');
    }
}

// Filter my issues by status when clicking on stat cards
function filterMyIssues(status) {
    setTimeout(() => {
        const issues = JSON.parse(localStorage.getItem('issues') || '[]');
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (!currentUser) return;
        
        const userIssues = issues.filter(issue => issue.userId === currentUser.id);
        let filteredIssues = userIssues;
        
        if (status) {
            filteredIssues = userIssues.filter(issue => issue.status === status);
        }
        
        displayMyIssues(filteredIssues);
    }, 100);
}

// Dashboard stats
function loadDashboardStats() {
    const issues = JSON.parse(localStorage.getItem('issues') || '[]');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    const userIssues = issues.filter(issue => issue.userId === currentUser.id);
    const userOrders = orders.filter(order => order.userId === currentUser.id);
    
    const pendingIssues = userIssues.filter(issue => issue.status === 'Pending').length;
    const resolvedIssues = userIssues.filter(issue => issue.status === 'Resolved').length;
    
    document.getElementById('totalIssues').textContent = userIssues.length;
    document.getElementById('pendingIssues').textContent = pendingIssues;
    document.getElementById('resolvedIssues').textContent = resolvedIssues;
    document.getElementById('totalOrders').textContent = userOrders.length;
}

function loadRecentActivity() {
    const issues = JSON.parse(localStorage.getItem('issues') || '[]');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const feedback = JSON.parse(localStorage.getItem('feedback') || '[]');
    
    const userIssues = issues.filter(issue => issue.userId === currentUser.id);
    const userOrders = orders.filter(order => order.userId === currentUser.id);
    const userFeedback = feedback.filter(fb => fb.userId === currentUser.id);
    
    const activities = [
        ...userIssues.map(issue => ({
            type: 'issue',
            text: `Reported issue: ${issue.title}`,
            date: issue.createdAt,
            status: issue.status,
            clickAction: () => showSection('myissues')
        })),
        ...userOrders.map(order => ({
            type: 'order',
            text: `Ordered food (₹${order.total})`,
            date: order.createdAt,
            status: order.status,
            clickAction: () => showSection('cafeteria')
        })),
        ...userFeedback.map(fb => ({
            type: 'feedback',
            text: `Submitted feedback for ${fb.category}`,
            date: fb.createdAt,
            rating: fb.rating,
            clickAction: () => showSection('feedback')
        }))
    ];
    
    // Sort by date (newest first)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const activityList = document.getElementById('recentActivityList');
    
    if (activities.length === 0) {
        activityList.innerHTML = '<p>No recent activity</p>';
        return;
    }
    
    activityList.innerHTML = activities.slice(0, 5).map((activity, index) => `
        <div class="activity-item clickable-activity" onclick="activities[${index}].clickAction()" title="Click to view section">
            <div class="activity-icon ${activity.type}">
                <i class="fas fa-${activity.type === 'issue' ? 'exclamation-triangle' : 
                    activity.type === 'order' ? 'utensils' : 'comment'}"></i>
            </div>
            <div class="activity-content">
                <p>${activity.text}</p>
                <small>${formatDate(activity.date)}</small>
                ${activity.status ? `<span class="status ${activity.status.toLowerCase()}">${activity.status}</span>` : ''}
                ${activity.rating ? `<span class="rating">${'★'.repeat(activity.rating)}</span>` : ''}
            </div>
            <div class="activity-arrow">
                <i class="fas fa-chevron-right"></i>
            </div>
        </div>
    `).join('');
    
    // Store activities globally for click handlers
    window.activities = activities.slice(0, 5);
}

// Cafeteria functions
function addToCart(itemName, price) {
    const existingItem = cart.find(item => item.name === itemName);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: itemName,
            price: price,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    showAlert(`${itemName} added to cart!`, 'success');
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty</p>';
        cartTotal.textContent = '0';
        return;
    }
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <span>${item.name} x ${item.quantity}</span>
            <span>₹${item.price * item.quantity}</span>
            <button onclick="removeFromCart('${item.name}')" class="btn btn-sm" style="background: #e53e3e; color: white; margin-left: 10px;">Remove</button>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = total;
}

function removeFromCart(itemName) {
    cart = cart.filter(item => item.name !== itemName);
    updateCartDisplay();
    showAlert('Item removed from cart', 'info');
}

function placeOrder() {
    if (cart.length === 0) {
        showAlert('Your cart is empty!', 'error');
        return;
    }
    
    const order = {
        id: Date.now().toString(),
        userId: currentUser.id,
        username: currentUser.username,
        items: [...cart],
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'Pending',
        createdAt: new Date().toISOString()
    };
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Clear cart
    cart = [];
    updateCartDisplay();
    
    showAlert('Order placed successfully!', 'success');
    loadDashboardStats();
    loadRecentActivity();
}

// Issue reporting functions
function handleIssueSubmit(e) {
    e.preventDefault();
    
    const category = document.getElementById('issueCategory').value;
    const title = document.getElementById('issueTitle').value;
    const description = document.getElementById('issueDescription').value;
    const location = document.getElementById('issueLocation').value;
    const priority = document.getElementById('issuePriority').value;
    const photo = document.getElementById('issuePhoto').files[0];
    
    if (!category || !title || !description || !location || !priority) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }
    
    const issue = {
        id: Date.now().toString(),
        userId: currentUser.id,
        username: currentUser.username,
        category,
        title,
        description,
        location,
        priority,
        status: 'Pending',
        upvotes: 0,
        comments: [],
        photo: photo ? photo.name : null,
        createdAt: new Date().toISOString()
    };
    
    const issues = JSON.parse(localStorage.getItem('issues') || '[]');
    issues.push(issue);
    localStorage.setItem('issues', JSON.stringify(issues));
    
    showAlert('Issue reported successfully!', 'success');
    document.getElementById('issueForm').reset();
    loadDashboardStats();
    loadRecentActivity();
    loadMyIssues();
}

function loadMyIssues() {
    const issues = JSON.parse(localStorage.getItem('issues') || '[]');
    const userIssues = issues.filter(issue => issue.userId === currentUser.id);
    
    const myIssuesList = document.getElementById('myIssuesList');
    
    if (userIssues.length === 0) {
        myIssuesList.innerHTML = '<p>No issues reported yet</p>';
        return;
    }
    
    myIssuesList.innerHTML = userIssues.map(issue => `
        <div class="issue-card ${issue.priority.toLowerCase()}-priority">
            <div class="issue-header">
                <h4 class="issue-title">${issue.title}</h4>
                <span class="issue-status status-${issue.status.toLowerCase().replace(' ', '')}">${issue.status}</span>
            </div>
            <div class="issue-meta">
                <span><i class="fas fa-tag"></i> ${issue.category}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${issue.location}</span>
                <span><i class="fas fa-calendar"></i> ${formatDate(issue.createdAt)}</span>
                <span><i class="fas fa-exclamation"></i> ${issue.priority}</span>
            </div>
            <div class="issue-description">${issue.description}</div>
            <div class="issue-actions">
                <button onclick="upvoteIssue('${issue.id}')" class="btn btn-sm btn-primary">
                    <i class="fas fa-thumbs-up"></i> Upvote (${issue.upvotes})
                </button>
                <button onclick="showComments('${issue.id}')" class="btn btn-sm" style="background: #4299e1; color: white;">
                    <i class="fas fa-comment"></i> Comments (${issue.comments.length})
                </button>
            </div>
        </div>
    `).join('');
}

function upvoteIssue(issueId) {
    const issues = JSON.parse(localStorage.getItem('issues') || '[]');
    const issue = issues.find(i => i.id === issueId);
    
    if (issue) {
        issue.upvotes += 1;
        localStorage.setItem('issues', JSON.stringify(issues));
        loadMyIssues();
        showAlert('Issue upvoted!', 'success');
    }
}

// Feedback functions
function setRating(rating) {
    currentRating = rating;
    document.getElementById('feedbackRating').value = rating;
    
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function handleFeedbackSubmit(e) {
    e.preventDefault();
    
    const category = document.getElementById('feedbackCategory').value;
    const rating = document.getElementById('feedbackRating').value;
    const text = document.getElementById('feedbackText').value;
    
    if (!category || !rating || !text) {
        showAlert('Please fill in all fields', 'error');
        return;
    }
    
    const feedback = {
        id: Date.now().toString(),
        userId: currentUser.id,
        username: currentUser.username,
        category,
        rating: parseInt(rating),
        text,
        createdAt: new Date().toISOString()
    };
    
    const feedbackList = JSON.parse(localStorage.getItem('feedback') || '[]');
    feedbackList.push(feedback);
    localStorage.setItem('feedback', JSON.stringify(feedbackList));
    
    showAlert('Feedback submitted successfully!', 'success');
    document.getElementById('feedbackForm').reset();
    
    // Reset rating stars
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => star.classList.remove('active'));
    currentRating = 0;
    
    loadRecentActivity();
}

// Lost and Found functions
function showLFTab(tabName) {
    const tabs = document.querySelectorAll('.lf-tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const buttons = document.querySelectorAll('.lf-tabs .tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`lf-${tabName}`).classList.add('active');
    event.target.classList.add('active');
}

function handleLostItemSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('lostItemName').value;
    const description = document.getElementById('lostItemDesc').value;
    const location = document.getElementById('lostItemLocation').value;
    const contact = document.getElementById('lostItemContact').value;
    
    if (!name || !description || !location || !contact) {
        showAlert('Please fill in all fields', 'error');
        return;
    }
    
    const item = {
        id: Date.now().toString(),
        userId: currentUser.id,
        username: currentUser.username,
        type: 'lost',
        name,
        description,
        location,
        contact,
        createdAt: new Date().toISOString()
    };
    
    const items = JSON.parse(localStorage.getItem('lostFoundItems') || '[]');
    items.push(item);
    localStorage.setItem('lostFoundItems', JSON.stringify(items));
    
    showAlert('Lost item reported successfully!', 'success');
    document.getElementById('lostItemForm').reset();
    loadLostFoundItems();
}

function handleFoundItemSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('foundItemName').value;
    const description = document.getElementById('foundItemDesc').value;
    const location = document.getElementById('foundItemLocation').value;
    const contact = document.getElementById('foundItemContact').value;
    
    if (!name || !description || !location || !contact) {
        showAlert('Please fill in all fields', 'error');
        return;
    }
    
    const item = {
        id: Date.now().toString(),
        userId: currentUser.id,
        username: currentUser.username,
        type: 'found',
        name,
        description,
        location,
        contact,
        createdAt: new Date().toISOString()
    };
    
    const items = JSON.parse(localStorage.getItem('lostFoundItems') || '[]');
    items.push(item);
    localStorage.setItem('lostFoundItems', JSON.stringify(items));
    
    showAlert('Found item reported successfully!', 'success');
    document.getElementById('foundItemForm').reset();
    loadLostFoundItems();
}

function loadLostFoundItems() {
    const items = JSON.parse(localStorage.getItem('lostFoundItems') || '[]');
    const lostFoundItems = document.getElementById('lostFoundItems');
    
    if (items.length === 0) {
        lostFoundItems.innerHTML = '<p>No items reported yet</p>';
        return;
    }
    
    lostFoundItems.innerHTML = items.map(item => `
        <div class="lf-item ${item.type}">
            <div class="lf-item-header">
                <h4>${item.name}</h4>
                <span class="lf-item-type type-${item.type}">${item.type.toUpperCase()}</span>
            </div>
            <p><strong>Description:</strong> ${item.description}</p>
            <p><strong>Location:</strong> ${item.location}</p>
            <p><strong>Contact:</strong> ${item.contact}</p>
            <p><strong>Reported by:</strong> ${item.username}</p>
            <small style="color: #718096;">${formatDate(item.createdAt)}</small>
        </div>
    `).join('');
}

// Transport functions
function showTransportTab(tabName) {
    const tabs = document.querySelectorAll('.transport-tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const buttons = document.querySelectorAll('.transport-tabs .tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`transport-${tabName}`).classList.add('active');
    event.target.classList.add('active');
}

function handleOfferRideSubmit(e) {
    e.preventDefault();
    
    const from = document.getElementById('rideFrom').value;
    const to = document.getElementById('rideTo').value;
    const dateTime = document.getElementById('rideDateTime').value;
    const seats = document.getElementById('rideSeats').value;
    const price = document.getElementById('ridePrice').value;
    
    if (!from || !to || !dateTime || !seats || !price) {
        showAlert('Please fill in all fields', 'error');
        return;
    }
    
    const ride = {
        id: Date.now().toString(),
        userId: currentUser.id,
        username: currentUser.username,
        from,
        to,
        dateTime,
        seats: parseInt(seats),
        availableSeats: parseInt(seats),
        price: parseInt(price),
        passengers: [],
        createdAt: new Date().toISOString()
    };
    
    const rides = JSON.parse(localStorage.getItem('rides') || '[]');
    rides.push(ride);
    localStorage.setItem('rides', JSON.stringify(rides));
    
    showAlert('Ride offered successfully!', 'success');
    document.getElementById('offerRideForm').reset();
    loadAvailableRides();
}

function searchRides() {
    const from = document.getElementById('searchFrom').value;
    const to = document.getElementById('searchTo').value;
    
    const rides = JSON.parse(localStorage.getItem('rides') || '[]');
    let filteredRides = rides.filter(ride => ride.availableSeats > 0);
    
    if (from) {
        filteredRides = filteredRides.filter(ride => 
            ride.from.toLowerCase().includes(from.toLowerCase())
        );
    }
    
    if (to) {
        filteredRides = filteredRides.filter(ride => 
            ride.to.toLowerCase().includes(to.toLowerCase())
        );
    }
    
    displayRides(filteredRides);
}

function loadAvailableRides() {
    const rides = JSON.parse(localStorage.getItem('rides') || '[]');
    const availableRides = rides.filter(ride => ride.availableSeats > 0);
    displayRides(availableRides);
}

function displayRides(rides) {
    const availableRides = document.getElementById('availableRides');
    
    if (rides.length === 0) {
        availableRides.innerHTML = '<p>No rides available</p>';
        return;
    }
    
    availableRides.innerHTML = rides.map(ride => `
        <div class="ride-card">
            <div class="ride-header">
                <div class="ride-route">${ride.from} → ${ride.to}</div>
                <div class="ride-price">₹${ride.price}/person</div>
            </div>
            <div class="ride-details">
                <div><i class="fas fa-user"></i> Driver: ${ride.username}</div>
                <div><i class="fas fa-calendar"></i> ${formatDateTime(ride.dateTime)}</div>
                <div><i class="fas fa-users"></i> Available: ${ride.availableSeats}/${ride.seats}</div>
            </div>
            ${ride.userId !== currentUser.id ? `
                <button onclick="bookRide('${ride.id}')" class="btn btn-primary mt-15">
                    <i class="fas fa-ticket-alt"></i> Book Ride
                </button>
            ` : '<p style="color: #718096; margin-top: 10px;">Your ride</p>'}
        </div>
    `).join('');
}

function bookRide(rideId) {
    const rides = JSON.parse(localStorage.getItem('rides') || '[]');
    const ride = rides.find(r => r.id === rideId);
    
    if (ride && ride.availableSeats > 0) {
        ride.availableSeats -= 1;
        ride.passengers.push({
            userId: currentUser.id,
            username: currentUser.username,
            bookedAt: new Date().toISOString()
        });
        
        localStorage.setItem('rides', JSON.stringify(rides));
        showAlert('Ride booked successfully!', 'success');
        loadAvailableRides();
    } else {
        showAlert('Sorry, no seats available!', 'error');
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
        word-wrap: break-word;
    `;

    // Set background color based on type
    switch (type) {
        case 'success':
            alert.style.background = 'linear-gradient(135deg, #48bb78, #38a169)';
            break;
        case 'error':
            alert.style.background = 'linear-gradient(135deg, #f56565, #e53e3e)';
            break;
        case 'warning':
            alert.style.background = 'linear-gradient(135deg, #ed8936, #dd6b20)';
            break;
        default:
            alert.style.background = 'linear-gradient(135deg, #4299e1, #3182ce)';
    }

    alert.textContent = message;

    // Add close button
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
        float: right;
        margin-left: 10px;
        cursor: pointer;
        font-size: 1.2rem;
    `;
    closeBtn.onclick = () => alert.remove();
    alert.appendChild(closeBtn);

    // Add to document
    document.body.appendChild(alert);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// Floating Action Button functionality
let fabMenuOpen = false;

function toggleFabMenu() {
    const fabMenu = document.querySelector('.fab-menu');
    const fab = document.querySelector('.fab');
    
    fabMenuOpen = !fabMenuOpen;
    
    if (fabMenuOpen) {
        fabMenu.classList.add('active');
        fab.style.transform = 'scale(1.1) rotate(45deg)';
    } else {
        fabMenu.classList.remove('active');
        fab.style.transform = 'scale(1) rotate(0deg)';
    }
}

// Close FAB menu when clicking outside
document.addEventListener('click', function(e) {
    const fabContainer = document.querySelector('.fab-container');
    if (fabMenuOpen && !fabContainer.contains(e.target)) {
        toggleFabMenu();
    }
});

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}
