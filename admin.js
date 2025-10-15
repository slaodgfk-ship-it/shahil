// Admin Panel JavaScript
let currentAdmin = null;

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPanel();
});

function initializeAdminPanel() {
    // Check if admin is logged in
    const adminData = localStorage.getItem('currentAdmin');
    if (!adminData) {
        window.location.href = 'index.html';
        return;
    }

    currentAdmin = JSON.parse(adminData);
    
    // Update welcome message
    document.getElementById('welcomeAdmin').textContent = `Welcome, ${currentAdmin.username}!`;
    
    // Load admin data
    loadAdminStats();
    loadPendingSignups();
    loadAllIssues();
    loadAllStudents();
    loadAllFeedback();
    loadAllOrders();
    loadAllLostFoundItems();
    loadAnalytics();
}

// Navigation functions with smooth transitions
function showAdminSection(sectionId) {
    const currentSection = document.querySelector('.content-section.active');
    const targetSection = document.getElementById(`admin-${sectionId}`);
    
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
            updateAdminMenuItems(sectionId);
        }, 300);
    } else {
        // No current section, show target immediately
        targetSection.classList.add('active');
        targetSection.style.animation = 'sectionSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards';
        updateAdminMenuItems(sectionId);
    }
}

function updateAdminMenuItems(sectionId) {
    // Update menu items
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => item.classList.remove('active'));
    
    // Find and activate the corresponding menu item
    const targetMenuItem = document.querySelector(`[onclick="showAdminSection('${sectionId}')"]`);
    if (targetMenuItem) {
        targetMenuItem.classList.add('active');
    }
}

// Filter issues by status when clicking on stat cards
function filterIssuesByStatus(status) {
    setTimeout(() => {
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.value = status;
            filterIssues();
        }
    }, 100);
}

// Load admin statistics
function loadAdminStats() {
    const issues = JSON.parse(localStorage.getItem('issues') || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const pendingSignups = JSON.parse(localStorage.getItem('pendingSignups') || '[]');
    const feedback = JSON.parse(localStorage.getItem('feedback') || '[]');
    
    const pendingIssues = issues.filter(issue => issue.status === 'Pending').length;
    const progressIssues = issues.filter(issue => issue.status === 'In Progress').length;
    const resolvedIssues = issues.filter(issue => issue.status === 'Resolved').length;
    
    document.getElementById('adminTotalIssues').textContent = issues.length;
    document.getElementById('adminPendingIssues').textContent = pendingIssues;
    document.getElementById('adminProgressIssues').textContent = progressIssues;
    document.getElementById('adminResolvedIssues').textContent = resolvedIssues;
    document.getElementById('totalStudents').textContent = users.length;
    document.getElementById('adminTotalOrders').textContent = orders.length;
    document.getElementById('pendingSignups').textContent = pendingSignups.length;
    document.getElementById('totalFeedback').textContent = feedback.length;
}

// Load and display all issues
function loadAllIssues() {
    const issues = JSON.parse(localStorage.getItem('issues') || '[]');
    displayIssues(issues);
}

function displayIssues(issues) {
    const issuesList = document.getElementById('adminIssuesList');
    
    if (issues.length === 0) {
        issuesList.innerHTML = '<p>No issues to display</p>';
        return;
    }
    
    // Sort by priority and date
    const sortedIssues = issues.sort((a, b) => {
        const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    issuesList.innerHTML = sortedIssues.map(issue => `
        <div class="issue-card ${issue.priority.toLowerCase()}-priority">
            <div class="issue-header">
                <div>
                    <h4 class="issue-title">${issue.title}</h4>
                    <p style="color: #718096; margin: 5px 0;">Reported by: ${issue.username}</p>
                </div>
                <div style="text-align: right;">
                    <span class="issue-status status-${issue.status.toLowerCase().replace(' ', '')}">${issue.status}</span>
                    <p style="color: #718096; font-size: 0.85rem; margin-top: 5px;">${formatDate(issue.createdAt)}</p>
                </div>
            </div>
            <div class="issue-meta">
                <span><i class="fas fa-tag"></i> ${issue.category}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${issue.location}</span>
                <span><i class="fas fa-exclamation"></i> ${issue.priority} Priority</span>
                <span><i class="fas fa-thumbs-up"></i> ${issue.upvotes} upvotes</span>
            </div>
            <div class="issue-description">${issue.description}</div>
            <div class="issue-actions">
                <select onchange="updateIssueStatus('${issue.id}', this.value)" class="status-select">
                    <option value="Pending" ${issue.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="In Progress" ${issue.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Resolved" ${issue.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                </select>
                <button onclick="viewIssueDetails('${issue.id}')" class="btn btn-sm btn-primary">
                    <i class="fas fa-eye"></i> View Details
                </button>
                <button onclick="deleteIssue('${issue.id}')" class="btn btn-sm" style="background: #e53e3e; color: white;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Update issue status
function updateIssueStatus(issueId, newStatus) {
    const issues = JSON.parse(localStorage.getItem('issues') || '[]');
    const issue = issues.find(i => i.id === issueId);
    
    if (issue) {
        issue.status = newStatus;
        issue.updatedAt = new Date().toISOString();
        issue.updatedBy = currentAdmin.username;
        
        localStorage.setItem('issues', JSON.stringify(issues));
        showAlert(`Issue status updated to ${newStatus}`, 'success');
        loadAdminStats();
        filterIssues(); // Refresh the display with current filters
    }
}

// Delete issue
function deleteIssue(issueId) {
    if (confirm('Are you sure you want to delete this issue?')) {
        let issues = JSON.parse(localStorage.getItem('issues') || '[]');
        issues = issues.filter(i => i.id !== issueId);
        localStorage.setItem('issues', JSON.stringify(issues));
        
        showAlert('Issue deleted successfully', 'success');
        loadAdminStats();
        loadAllIssues();
    }
}

// Filter issues
function filterIssues() {
    const statusFilter = document.getElementById('statusFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;
    
    const issues = JSON.parse(localStorage.getItem('issues') || '[]');
    let filteredIssues = issues;
    
    if (statusFilter) {
        filteredIssues = filteredIssues.filter(issue => issue.status === statusFilter);
    }
    
    if (categoryFilter) {
        filteredIssues = filteredIssues.filter(issue => issue.category === categoryFilter);
    }
    
    if (priorityFilter) {
        filteredIssues = filteredIssues.filter(issue => issue.priority === priorityFilter);
    }
    
    displayIssues(filteredIssues);
}

// Load all students
function loadAllStudents() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const studentsList = document.getElementById('studentsList');
    
    if (users.length === 0) {
        studentsList.innerHTML = '<p>No students registered yet</p>';
        return;
    }
    
    studentsList.innerHTML = users.map(user => `
        <div class="student-card">
            <div class="student-info">
                <h4>${user.username}</h4>
                <p><i class="fas fa-envelope"></i> ${user.email}</p>
                <p><i class="fas fa-book"></i> ${user.course} - ${user.year}</p>
                <p><i class="fas fa-home"></i> Room: ${user.roomNo} | <i class="fas fa-phone"></i> ${user.mobile}</p>
                <small style="color: #718096;">Registered: ${formatDate(user.registeredAt)}</small>
            </div>
            <div>
                <button onclick="viewStudentDetails('${user.id}')" class="btn btn-sm btn-primary">
                    <i class="fas fa-eye"></i> View Details
                </button>
            </div>
        </div>
    `).join('');
}

// Search students
function searchStudents() {
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.course.toLowerCase().includes(searchTerm) ||
        user.roomNo.toLowerCase().includes(searchTerm)
    );
    
    const studentsList = document.getElementById('studentsList');
    
    if (filteredUsers.length === 0) {
        studentsList.innerHTML = '<p>No students found</p>';
        return;
    }
    
    studentsList.innerHTML = filteredUsers.map(user => `
        <div class="student-card">
            <div class="student-info">
                <h4>${user.username}</h4>
                <p><i class="fas fa-envelope"></i> ${user.email}</p>
                <p><i class="fas fa-book"></i> ${user.course} - ${user.year}</p>
                <p><i class="fas fa-home"></i> Room: ${user.roomNo} | <i class="fas fa-phone"></i> ${user.mobile}</p>
                <small style="color: #718096;">Registered: ${formatDate(user.registeredAt)}</small>
            </div>
            <div>
                <button onclick="viewStudentDetails('${user.id}')" class="btn btn-sm btn-primary">
                    <i class="fas fa-eye"></i> View Details
                </button>
            </div>
        </div>
    `).join('');
}

// Load all feedback
function loadAllFeedback() {
    const feedback = JSON.parse(localStorage.getItem('feedback') || '[]');
    displayFeedback(feedback);
}

function displayFeedback(feedback) {
    const feedbackList = document.getElementById('feedbackList');
    
    if (feedback.length === 0) {
        feedbackList.innerHTML = '<p>No feedback submitted yet</p>';
        return;
    }
    
    // Sort by date (newest first)
    const sortedFeedback = feedback.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    feedbackList.innerHTML = sortedFeedback.map(fb => `
        <div class="feedback-card">
            <div class="feedback-header">
                <div>
                    <h4>${fb.category} Feedback</h4>
                    <p style="color: #718096;">by ${fb.username}</p>
                </div>
                <div style="text-align: right;">
                    <div class="feedback-rating">
                        ${Array.from({length: 5}, (_, i) => 
                            `<span class="star ${i < fb.rating ? 'active' : ''}">★</span>`
                        ).join('')}
                    </div>
                    <small style="color: #718096;">${formatDate(fb.createdAt)}</small>
                </div>
            </div>
            <div class="feedback-text">${fb.text}</div>
        </div>
    `).join('');
}

// Filter feedback
function filterFeedback() {
    const categoryFilter = document.getElementById('feedbackCategoryFilter').value;
    const ratingFilter = document.getElementById('ratingFilter').value;
    
    const feedback = JSON.parse(localStorage.getItem('feedback') || '[]');
    let filteredFeedback = feedback;
    
    if (categoryFilter) {
        filteredFeedback = filteredFeedback.filter(fb => fb.category === categoryFilter);
    }
    
    if (ratingFilter) {
        filteredFeedback = filteredFeedback.filter(fb => fb.rating === parseInt(ratingFilter));
    }
    
    displayFeedback(filteredFeedback);
}

// Load all orders
function loadAllOrders() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    displayOrders(orders);
}

function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<p>No orders to display</p>';
        return;
    }
    
    // Sort by date (newest first)
    const sortedOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    ordersList.innerHTML = sortedOrders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <span class="order-id">Order #${order.id.slice(-6)}</span>
                    <p style="color: #718096; margin: 5px 0;">Customer: ${order.username}</p>
                </div>
                <div style="text-align: right;">
                    <select onchange="updateOrderStatus('${order.id}', this.value)" class="status-select">
                        <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
                        <option value="Ready" ${order.status === 'Ready' ? 'selected' : ''}>Ready</option>
                        <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    </select>
                    <p style="color: #718096; font-size: 0.85rem; margin-top: 5px;">${formatDate(order.createdAt)}</p>
                </div>
            </div>
            <div class="order-items">
                <strong>Items:</strong>
                <ul style="margin: 5px 0; padding-left: 20px;">
                    ${order.items.map(item => `<li>${item.name} x ${item.quantity} - ₹${item.price * item.quantity}</li>`).join('')}
                </ul>
            </div>
            <div class="order-total">Total: ₹${order.total}</div>
        </div>
    `).join('');
}

// Update order status
function updateOrderStatus(orderId, newStatus) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
        order.status = newStatus;
        order.updatedAt = new Date().toISOString();
        
        localStorage.setItem('orders', JSON.stringify(orders));
        showAlert(`Order status updated to ${newStatus}`, 'success');
        loadAdminStats();
    }
}

// Filter orders
function filterOrders() {
    const statusFilter = document.getElementById('orderStatusFilter').value;
    const dateFilter = document.getElementById('orderDateFilter').value;
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    let filteredOrders = orders;
    
    if (statusFilter) {
        filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
    }
    
    if (dateFilter) {
        const filterDate = new Date(dateFilter).toDateString();
        filteredOrders = filteredOrders.filter(order => 
            new Date(order.createdAt).toDateString() === filterDate
        );
    }
    
    displayOrders(filteredOrders);
}

// Load Lost & Found items
function loadAllLostFoundItems() {
    const items = JSON.parse(localStorage.getItem('lostFoundItems') || '[]');
    
    const lostItems = items.filter(item => item.type === 'lost');
    const foundItems = items.filter(item => item.type === 'found');
    
    displayLostItems(lostItems);
    displayFoundItems(foundItems);
}

function displayLostItems(items) {
    const lostItemsList = document.getElementById('adminLostItems');
    
    if (items.length === 0) {
        lostItemsList.innerHTML = '<p>No lost items reported</p>';
        return;
    }
    
    lostItemsList.innerHTML = items.map(item => `
        <div class="lf-item lost">
            <div class="lf-item-header">
                <h4>${item.name}</h4>
                <span class="lf-item-type type-lost">LOST</span>
            </div>
            <p><strong>Description:</strong> ${item.description}</p>
            <p><strong>Last Seen:</strong> ${item.location}</p>
            <p><strong>Contact:</strong> ${item.contact}</p>
            <p><strong>Reported by:</strong> ${item.username}</p>
            <small style="color: #718096;">${formatDate(item.createdAt)}</small>
            <div style="margin-top: 10px;">
                <button onclick="deleteLostFoundItem('${item.id}')" class="btn btn-sm" style="background: #e53e3e; color: white;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function displayFoundItems(items) {
    const foundItemsList = document.getElementById('adminFoundItems');
    
    if (items.length === 0) {
        foundItemsList.innerHTML = '<p>No found items reported</p>';
        return;
    }
    
    foundItemsList.innerHTML = items.map(item => `
        <div class="lf-item found">
            <div class="lf-item-header">
                <h4>${item.name}</h4>
                <span class="lf-item-type type-found">FOUND</span>
            </div>
            <p><strong>Description:</strong> ${item.description}</p>
            <p><strong>Found at:</strong> ${item.location}</p>
            <p><strong>Contact:</strong> ${item.contact}</p>
            <p><strong>Reported by:</strong> ${item.username}</p>
            <small style="color: #718096;">${formatDate(item.createdAt)}</small>
            <div style="margin-top: 10px;">
                <button onclick="deleteLostFoundItem('${item.id}')" class="btn btn-sm" style="background: #e53e3e; color: white;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Lost & Found admin tabs
function showLFAdminTab(tabName) {
    const tabs = document.querySelectorAll('.lf-admin-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const buttons = document.querySelectorAll('.lf-admin-tabs .tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`lf-admin-${tabName}`).classList.add('active');
    event.target.classList.add('active');
}

// Delete lost/found item
function deleteLostFoundItem(itemId) {
    if (confirm('Are you sure you want to delete this item?')) {
        let items = JSON.parse(localStorage.getItem('lostFoundItems') || '[]');
        items = items.filter(item => item.id !== itemId);
        localStorage.setItem('lostFoundItems', JSON.stringify(items));
        
        showAlert('Item deleted successfully', 'success');
        loadAllLostFoundItems();
    }
}

// View issue details (modal or detailed view)
function viewIssueDetails(issueId) {
    const issues = JSON.parse(localStorage.getItem('issues') || '[]');
    const issue = issues.find(i => i.id === issueId);
    
    if (issue) {
        const details = `
Issue ID: ${issue.id}
Title: ${issue.title}
Category: ${issue.category}
Priority: ${issue.priority}
Status: ${issue.status}
Location: ${issue.location}
Reported by: ${issue.username}
Date: ${formatDate(issue.createdAt)}

Description:
${issue.description}

Upvotes: ${issue.upvotes}
Comments: ${issue.comments.length}
        `;
        
        alert(details);
    }
}

// View student details
function viewStudentDetails(userId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === userId);
    
    if (user) {
        const issues = JSON.parse(localStorage.getItem('issues') || '[]');
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const feedback = JSON.parse(localStorage.getItem('feedback') || '[]');
        
        const userIssues = issues.filter(issue => issue.userId === userId);
        const userOrders = orders.filter(order => order.userId === userId);
        const userFeedback = feedback.filter(fb => fb.userId === userId);
        
        let blockInfo = '';
        if (user.isBlocked) {
            blockInfo = `
BLOCKED INFORMATION:
- Status: BLOCKED
- Blocked Date: ${formatDate(user.blockedAt)}
- Blocked By: ${user.blockedBy}
- Block Reason: ${user.blockReason}
`;
        }
        
        let blockHistory = '';
        if (user.blockHistory && user.blockHistory.length > 0) {
            blockHistory = `
BLOCK HISTORY:
${user.blockHistory.map((block, index) => 
    `${index + 1}. Blocked: ${formatDate(block.blockedAt)} by ${block.blockedBy}
   Reason: ${block.blockReason}
   Unblocked: ${formatDate(block.unblockedAt)} by ${block.unblockedBy}`
).join('\n')}
`;
        }
        
        const details = `
STUDENT DETAILS:
Username: ${user.username}
Email: ${user.email}
Course: ${user.course}
Year: ${user.year}
Room: ${user.roomNo}
Mobile: ${user.mobile}
Registered: ${formatDate(user.registeredAt)}
${user.approvedBy ? `Approved By: ${user.approvedBy}` : ''}
${blockInfo}
ACTIVITY SUMMARY:
- Issues Reported: ${userIssues.length}
- Food Orders: ${userOrders.length}
- Feedback Submitted: ${userFeedback.length}
${blockHistory}
        `;
        
        alert(details);
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
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

// Load pending signups
function loadPendingSignups() {
    const pendingSignups = JSON.parse(localStorage.getItem('pendingSignups') || '[]');
    displayPendingSignups(pendingSignups);
}

function displayPendingSignups(signups) {
    const pendingList = document.getElementById('pendingSignupsList');
    
    if (signups.length === 0) {
        pendingList.innerHTML = '<p>No pending signup requests</p>';
        return;
    }
    
    // Sort by submission date (newest first)
    const sortedSignups = signups.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    pendingList.innerHTML = sortedSignups.map(signup => `
        <div class="pending-signup-card">
            <div class="pending-header">
                <div class="pending-info">
                    <h4>${signup.username}</h4>
                    <p><i class="fas fa-envelope"></i> ${signup.email}</p>
                    <p><i class="fas fa-book"></i> ${signup.course} - ${signup.year}</p>
                    <p><i class="fas fa-home"></i> Room: ${signup.roomNo}</p>
                    <p><i class="fas fa-phone"></i> ${signup.mobile}</p>
                    <small style="color: #718096;">Submitted: ${formatDate(signup.submittedAt)}</small>
                </div>
                <div class="pending-actions">
                    <button onclick="approveSignup('${signup.id}')" class="btn btn-sm btn-approve">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button onclick="rejectSignup('${signup.id}')" class="btn btn-sm btn-reject">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    <button onclick="viewSignupDetails('${signup.id}')" class="btn btn-sm btn-primary">
                        <i class="fas fa-eye"></i> Details
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Approve signup
function approveSignup(signupId) {
    const pendingSignups = JSON.parse(localStorage.getItem('pendingSignups') || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const signupIndex = pendingSignups.findIndex(s => s.id === signupId);
    if (signupIndex !== -1) {
        const approvedUser = pendingSignups[signupIndex];
        
        // Remove from pending and add to users
        pendingSignups.splice(signupIndex, 1);
        
        // Clean up the user object
        delete approvedUser.status;
        delete approvedUser.submittedAt;
        approvedUser.approvedAt = new Date().toISOString();
        approvedUser.approvedBy = currentAdmin.username;
        
        users.push(approvedUser);
        
        localStorage.setItem('pendingSignups', JSON.stringify(pendingSignups));
        localStorage.setItem('users', JSON.stringify(users));
        
        showAlert('User approved successfully!', 'success');
        loadAdminStats();
        loadPendingSignups();
        loadAllStudents();
    }
}

// Reject signup
function rejectSignup(signupId) {
    if (confirm('Are you sure you want to reject this signup request?')) {
        let pendingSignups = JSON.parse(localStorage.getItem('pendingSignups') || '[]');
        pendingSignups = pendingSignups.filter(s => s.id !== signupId);
        localStorage.setItem('pendingSignups', JSON.stringify(pendingSignups));
        
        showAlert('Signup request rejected', 'info');
        loadAdminStats();
        loadPendingSignups();
    }
}

// Enhanced student management
function loadAllStudents() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    updateStudentSummary(users);
    displayStudents(users);
}

function updateStudentSummary(users) {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const newStudents = users.filter(user => 
        new Date(user.registeredAt) > oneWeekAgo && !user.isBlocked
    ).length;
    const blockedStudents = users.filter(user => user.isBlocked).length;
    
    // Calculate active students (those who have activity in the last month and are not blocked)
    const issues = JSON.parse(localStorage.getItem('issues') || '[]');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const feedback = JSON.parse(localStorage.getItem('feedback') || '[]');
    
    const activeUserIds = new Set();
    
    [...issues, ...orders, ...feedback].forEach(item => {
        if (item.createdAt && new Date(item.createdAt) > oneMonthAgo) {
            const user = users.find(u => u.id === item.userId);
            if (user && !user.isBlocked) {
                activeUserIds.add(item.userId);
            }
        }
    });
    
    document.getElementById('totalStudentsCount').textContent = users.length;
    document.getElementById('activeStudentsCount').textContent = activeUserIds.size;
    document.getElementById('newStudentsCount').textContent = newStudents;
    
    // Update the third card to show blocked students instead of new students
    const thirdCard = document.querySelector('.summary-cards .summary-card:nth-child(3)');
    if (thirdCard) {
        thirdCard.innerHTML = `
            <h4>${blockedStudents}</h4>
            <p>Blocked Students</p>
        `;
        thirdCard.style.borderLeftColor = blockedStudents > 0 ? '#e53e3e' : '#667eea';
    }
}

function displayStudents(users) {
    const studentsList = document.getElementById('studentsList');
    
    if (users.length === 0) {
        studentsList.innerHTML = '<p>No students registered yet</p>';
        return;
    }
    
    // Sort by registration date (newest first)
    const sortedUsers = users.sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
    
    studentsList.innerHTML = sortedUsers.map(user => {
        const isNew = new Date(user.registeredAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const isBlocked = user.isBlocked;
        
        let statusClass, statusText;
        if (isBlocked) {
            statusClass = 'status-blocked';
            statusText = 'BLOCKED';
        } else if (isNew) {
            statusClass = 'status-new';
            statusText = 'NEW';
        } else {
            statusClass = 'status-active';
            statusText = 'ACTIVE';
        }
        
        return `
            <div class="student-card ${isBlocked ? 'blocked-card' : ''}">
                <span class="student-status ${statusClass}">${statusText}</span>
                <div class="student-info">
                    <h4>${user.username}</h4>
                    <p><i class="fas fa-envelope"></i> ${user.email}</p>
                    <p><i class="fas fa-book"></i> ${user.course} - ${user.year}</p>
                    <p><i class="fas fa-home"></i> Room: ${user.roomNo} | <i class="fas fa-phone"></i> ${user.mobile}</p>
                    <small style="color: #718096;">Registered: ${formatDate(user.registeredAt)}</small>
                    ${user.approvedBy ? `<small style="color: #38a169;">Approved by: ${user.approvedBy}</small>` : ''}
                </div>
                <div class="student-actions">
                    <button onclick="viewStudentDetails('${user.id}')" class="btn btn-sm btn-primary">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button onclick="removeStudent('${user.id}')" class="btn btn-sm btn-reject">
                        <i class="fas fa-user-times"></i> Remove
                    </button>
                    <button onclick="resetStudentPassword('${user.id}')" class="btn btn-sm" style="background: #ed8936; color: white;">
                        <i class="fas fa-key"></i> Reset Password
                    </button>
                    ${user.isBlocked ? 
                        `<button onclick="unblockStudent('${user.id}')" class="btn btn-sm btn-success">
                            <i class="fas fa-unlock"></i> Unblock
                        </button>` :
                        `<button onclick="blockStudent('${user.id}')" class="btn btn-sm" style="background: #e53e3e; color: white;">
                            <i class="fas fa-ban"></i> Block
                        </button>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

// Remove student
function removeStudent(userId) {
    if (confirm('Are you sure you want to remove this student? This will also delete all their data.')) {
        // Remove from users
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        users = users.filter(u => u.id !== userId);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Remove their issues
        let issues = JSON.parse(localStorage.getItem('issues') || '[]');
        issues = issues.filter(i => i.userId !== userId);
        localStorage.setItem('issues', JSON.stringify(issues));
        
        // Remove their orders
        let orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders = orders.filter(o => o.userId !== userId);
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Remove their feedback
        let feedback = JSON.parse(localStorage.getItem('feedback') || '[]');
        feedback = feedback.filter(f => f.userId !== userId);
        localStorage.setItem('feedback', JSON.stringify(feedback));
        
        showAlert('Student removed successfully', 'success');
        loadAdminStats();
        loadAllStudents();
        loadAllIssues();
        loadAllOrders();
        loadAllFeedback();
    }
}

// Reset student password
function resetStudentPassword(userId) {
    const newPassword = prompt('Enter new password for the student:');
    if (newPassword && newPassword.length >= 6) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.id === userId);
        if (user) {
            user.password = newPassword;
            user.passwordResetAt = new Date().toISOString();
            user.passwordResetBy = currentAdmin.username;
            localStorage.setItem('users', JSON.stringify(users));
            showAlert('Password reset successfully', 'success');
        }
    } else {
        showAlert('Password must be at least 6 characters long', 'error');
    }
}

// Block student
function blockStudent(userId) {
    const reason = prompt('Enter reason for blocking this student (optional):');
    if (confirm('Are you sure you want to block this student? They will not be able to login.')) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.id === userId);
        if (user) {
            user.isBlocked = true;
            user.blockedAt = new Date().toISOString();
            user.blockedBy = currentAdmin.username;
            user.blockReason = reason || 'No reason provided';
            
            localStorage.setItem('users', JSON.stringify(users));
            showAlert(`Student ${user.username} has been blocked`, 'warning');
            loadAllStudents();
            updateStudentSummary(users);
        }
    }
}

// Unblock student
function unblockStudent(userId) {
    if (confirm('Are you sure you want to unblock this student?')) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.id === userId);
        if (user) {
            user.isBlocked = false;
            user.unblockedAt = new Date().toISOString();
            user.unblockedBy = currentAdmin.username;
            
            // Keep block history
            if (!user.blockHistory) {
                user.blockHistory = [];
            }
            user.blockHistory.push({
                blockedAt: user.blockedAt,
                blockedBy: user.blockedBy,
                blockReason: user.blockReason,
                unblockedAt: user.unblockedAt,
                unblockedBy: user.unblockedBy
            });
            
            // Remove current block info
            delete user.blockedAt;
            delete user.blockedBy;
            delete user.blockReason;
            
            localStorage.setItem('users', JSON.stringify(users));
            showAlert(`Student ${user.username} has been unblocked`, 'success');
            loadAllStudents();
            updateStudentSummary(users);
        }
    }
}

// Filter students
function filterStudents() {
    const courseFilter = document.getElementById('studentCourseFilter').value;
    const yearFilter = document.getElementById('studentYearFilter').value;
    const statusFilter = document.getElementById('studentStatusFilter').value;
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    let filteredUsers = users;
    
    if (courseFilter) {
        filteredUsers = filteredUsers.filter(user => user.course === courseFilter);
    }
    
    if (yearFilter) {
        filteredUsers = filteredUsers.filter(user => user.year === yearFilter);
    }
    
    if (statusFilter) {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        switch (statusFilter) {
            case 'active':
                filteredUsers = filteredUsers.filter(user => !user.isBlocked);
                break;
            case 'blocked':
                filteredUsers = filteredUsers.filter(user => user.isBlocked);
                break;
            case 'new':
                filteredUsers = filteredUsers.filter(user => 
                    new Date(user.registeredAt) > oneWeekAgo && !user.isBlocked
                );
                break;
        }
    }
    
    if (searchTerm) {
        filteredUsers = filteredUsers.filter(user => 
            user.username.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            user.roomNo.toLowerCase().includes(searchTerm)
        );
    }
    
    displayStudents(filteredUsers);
}

// Export student data
function exportStudentData() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const issues = JSON.parse(localStorage.getItem('issues') || '[]');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const feedback = JSON.parse(localStorage.getItem('feedback') || '[]');
    
    const exportData = users.map(user => {
        const userIssues = issues.filter(i => i.userId === user.id);
        const userOrders = orders.filter(o => o.userId === user.id);
        const userFeedback = feedback.filter(f => f.userId === user.id);
        
        return {
            username: user.username,
            email: user.email,
            course: user.course,
            year: user.year,
            roomNo: user.roomNo,
            mobile: user.mobile,
            registeredAt: user.registeredAt,
            totalIssues: userIssues.length,
            totalOrders: userOrders.length,
            totalFeedback: userFeedback.length
        };
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + 
        "Username,Email,Course,Year,Room,Mobile,Registered,Issues,Orders,Feedback\n" +
        exportData.map(row => Object.values(row).join(',')).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('Student data exported successfully', 'success');
}

// Analytics functions
function loadAnalytics() {
    loadCategoryStats();
    loadCourseStats();
    loadActivityMetrics();
}

function loadCategoryStats() {
    const issues = JSON.parse(localStorage.getItem('issues') || '[]');
    const categoryStats = {};
    
    issues.forEach(issue => {
        categoryStats[issue.category] = (categoryStats[issue.category] || 0) + 1;
    });
    
    const categoryStatsDiv = document.getElementById('categoryStats');
    if (Object.keys(categoryStats).length === 0) {
        categoryStatsDiv.innerHTML = '<p>No issue data available</p>';
        return;
    }
    
    const maxCount = Math.max(...Object.values(categoryStats));
    
    categoryStatsDiv.innerHTML = Object.entries(categoryStats)
        .sort(([,a], [,b]) => b - a)
        .map(([category, count]) => {
            const percentage = (count / maxCount) * 100;
            const priority = count > maxCount * 0.7 ? 'high' : count > maxCount * 0.3 ? 'medium' : 'low';
            
            return `
                <div class="stat-bar ${priority}">
                    <span>${category}</span>
                    <span>${count} issues</span>
                </div>
            `;
        }).join('');
}

function loadCourseStats() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const courseStats = {};
    
    users.forEach(user => {
        courseStats[user.course] = (courseStats[user.course] || 0) + 1;
    });
    
    const courseStatsDiv = document.getElementById('courseStats');
    if (Object.keys(courseStats).length === 0) {
        courseStatsDiv.innerHTML = '<p>No student data available</p>';
        return;
    }
    
    const totalStudents = users.length;
    
    courseStatsDiv.innerHTML = Object.entries(courseStats)
        .sort(([,a], [,b]) => b - a)
        .map(([course, count]) => {
            const percentage = ((count / totalStudents) * 100).toFixed(1);
            
            return `
                <div class="stat-bar">
                    <span>${course}</span>
                    <span>${count} (${percentage}%)</span>
                </div>
            `;
        }).join('');
}

function loadActivityMetrics() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const issues = JSON.parse(localStorage.getItem('issues') || '[]');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const feedback = JSON.parse(localStorage.getItem('feedback') || '[]');
    
    const totalStudents = users.length;
    const resolvedIssues = issues.filter(i => i.status === 'Resolved').length;
    const totalIssues = issues.length;
    
    const avgIssues = totalStudents > 0 ? (totalIssues / totalStudents).toFixed(1) : 0;
    const avgOrders = totalStudents > 0 ? (orders.length / totalStudents).toFixed(1) : 0;
    const avgRating = feedback.length > 0 ? 
        (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1) : 0;
    const resolutionRate = totalIssues > 0 ? 
        ((resolvedIssues / totalIssues) * 100).toFixed(0) : 0;
    
    document.getElementById('avgIssuesPerStudent').textContent = avgIssues;
    document.getElementById('avgOrdersPerStudent').textContent = avgOrders;
    document.getElementById('avgFeedbackRating').textContent = avgRating;
    document.getElementById('resolutionRate').textContent = resolutionRate + '%';
}

// Report generation functions
function generateMonthlyReport() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const issues = JSON.parse(localStorage.getItem('issues') || '[]');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const feedback = JSON.parse(localStorage.getItem('feedback') || '[]');
    
    const monthlyUsers = users.filter(u => new Date(u.registeredAt) >= lastMonth);
    const monthlyIssues = issues.filter(i => new Date(i.createdAt) >= lastMonth);
    const monthlyOrders = orders.filter(o => new Date(o.createdAt) >= lastMonth);
    const monthlyFeedback = feedback.filter(f => new Date(f.createdAt) >= lastMonth);
    
    const report = `
MONTHLY REPORT - ${lastMonth.toLocaleDateString()} to ${now.toLocaleDateString()}

NEW REGISTRATIONS: ${monthlyUsers.length}
NEW ISSUES: ${monthlyIssues.length}
FOOD ORDERS: ${monthlyOrders.length}
FEEDBACK RECEIVED: ${monthlyFeedback.length}

ISSUE BREAKDOWN:
${monthlyIssues.reduce((acc, issue) => {
    acc[issue.category] = (acc[issue.category] || 0) + 1;
    return acc;
}, {})}

AVERAGE FEEDBACK RATING: ${monthlyFeedback.length > 0 ? 
    (monthlyFeedback.reduce((sum, f) => sum + f.rating, 0) / monthlyFeedback.length).toFixed(1) : 'N/A'}
    `;
    
    alert(report);
}

function generateIssueReport() {
    const issues = JSON.parse(localStorage.getItem('issues') || '[]');
    
    const categoryBreakdown = issues.reduce((acc, issue) => {
        acc[issue.category] = (acc[issue.category] || 0) + 1;
        return acc;
    }, {});
    
    const priorityBreakdown = issues.reduce((acc, issue) => {
        acc[issue.priority] = (acc[issue.priority] || 0) + 1;
        return acc;
    }, {});
    
    const statusBreakdown = issues.reduce((acc, issue) => {
        acc[issue.status] = (acc[issue.status] || 0) + 1;
        return acc;
    }, {});
    
    const report = `
ISSUE ANALYSIS REPORT

TOTAL ISSUES: ${issues.length}

BY CATEGORY:
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat}: ${count}`).join('\n')}

BY PRIORITY:
${Object.entries(priorityBreakdown).map(([pri, count]) => `${pri}: ${count}`).join('\n')}

BY STATUS:
${Object.entries(statusBreakdown).map(([status, count]) => `${status}: ${count}`).join('\n')}

RESOLUTION RATE: ${issues.length > 0 ? 
    ((issues.filter(i => i.status === 'Resolved').length / issues.length) * 100).toFixed(1) : 0}%
    `;
    
    alert(report);
}

function generateFeedbackReport() {
    const feedback = JSON.parse(localStorage.getItem('feedback') || '[]');
    
    if (feedback.length === 0) {
        alert('No feedback data available');
        return;
    }
    
    const categoryBreakdown = feedback.reduce((acc, fb) => {
        acc[fb.category] = acc[fb.category] || { count: 0, totalRating: 0 };
        acc[fb.category].count++;
        acc[fb.category].totalRating += fb.rating;
        return acc;
    }, {});
    
    const avgRating = (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1);
    
    const report = `
FEEDBACK SUMMARY REPORT

TOTAL FEEDBACK: ${feedback.length}
AVERAGE RATING: ${avgRating}/5

BY CATEGORY:
${Object.entries(categoryBreakdown).map(([cat, data]) => 
    `${cat}: ${data.count} responses, Avg: ${(data.totalRating / data.count).toFixed(1)}/5`
).join('\n')}

RATING DISTRIBUTION:
${[5,4,3,2,1].map(rating => {
    const count = feedback.filter(f => f.rating === rating).length;
    const percentage = ((count / feedback.length) * 100).toFixed(1);
    return `${rating} stars: ${count} (${percentage}%)`;
}).join('\n')}
    `;
    
    alert(report);
}

function generateStudentActivityReport() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const issues = JSON.parse(localStorage.getItem('issues') || '[]');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const feedback = JSON.parse(localStorage.getItem('feedback') || '[]');
    
    const userActivity = users.map(user => {
        const userIssues = issues.filter(i => i.userId === user.id);
        const userOrders = orders.filter(o => o.userId === user.id);
        const userFeedback = feedback.filter(f => f.userId === user.id);
        
        return {
            username: user.username,
            course: user.course,
            issues: userIssues.length,
            orders: userOrders.length,
            feedback: userFeedback.length,
            totalActivity: userIssues.length + userOrders.length + userFeedback.length
        };
    }).sort((a, b) => b.totalActivity - a.totalActivity);
    
    const report = `
STUDENT ACTIVITY REPORT

TOTAL STUDENTS: ${users.length}

TOP 10 MOST ACTIVE STUDENTS:
${userActivity.slice(0, 10).map((user, index) => 
    `${index + 1}. ${user.username} (${user.course}) - ${user.totalActivity} activities`
).join('\n')}

ACTIVITY BREAKDOWN:
Average Issues per Student: ${users.length > 0 ? (issues.length / users.length).toFixed(1) : 0}
Average Orders per Student: ${users.length > 0 ? (orders.length / users.length).toFixed(1) : 0}
Average Feedback per Student: ${users.length > 0 ? (feedback.length / users.length).toFixed(1) : 0}
    `;
    
    alert(report);
}

// Search and filter functions for pending signups
function searchPendingSignups() {
    filterPendingSignups();
}

function filterPendingSignups() {
    const searchTerm = document.getElementById('pendingSearch').value.toLowerCase();
    const courseFilter = document.getElementById('courseFilter').value;
    const yearFilter = document.getElementById('yearFilter').value;
    
    const pendingSignups = JSON.parse(localStorage.getItem('pendingSignups') || '[]');
    let filteredSignups = pendingSignups;
    
    if (searchTerm) {
        filteredSignups = filteredSignups.filter(signup => 
            signup.username.toLowerCase().includes(searchTerm) ||
            signup.email.toLowerCase().includes(searchTerm) ||
            signup.roomNo.toLowerCase().includes(searchTerm)
        );
    }
    
    if (courseFilter) {
        filteredSignups = filteredSignups.filter(signup => signup.course === courseFilter);
    }
    
    if (yearFilter) {
        filteredSignups = filteredSignups.filter(signup => signup.year === yearFilter);
    }
    
    displayPendingSignups(filteredSignups);
}

// View signup details
function viewSignupDetails(signupId) {
    const pendingSignups = JSON.parse(localStorage.getItem('pendingSignups') || '[]');
    const signup = pendingSignups.find(s => s.id === signupId);
    
    if (signup) {
        const details = `
SIGNUP REQUEST DETAILS

Username: ${signup.username}
Email: ${signup.email}
Course: ${signup.course}
Year: ${signup.year}
Room Number: ${signup.roomNo}
Mobile: ${signup.mobile}
Submitted: ${formatDate(signup.submittedAt)}
        `;
        
        alert(details);
    }
}

// Show student statistics
function showStudentStats() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const courseStats = users.reduce((acc, user) => {
        acc[user.course] = (acc[user.course] || 0) + 1;
        return acc;
    }, {});
    
    const yearStats = users.reduce((acc, user) => {
        acc[user.year] = (acc[user.year] || 0) + 1;
        return acc;
    }, {});
    
    const stats = `
STUDENT STATISTICS

TOTAL STUDENTS: ${users.length}

BY COURSE:
${Object.entries(courseStats).map(([course, count]) => `${course}: ${count}`).join('\n')}

BY YEAR:
${Object.entries(yearStats).map(([year, count]) => `${year}: ${count}`).join('\n')}

REGISTRATION TREND:
Last 7 days: ${users.filter(u => new Date(u.registeredAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
Last 30 days: ${users.filter(u => new Date(u.registeredAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
    `;
    
    alert(stats);
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

// Change admin credentials function
function changeAdminCredentials() {
    const currentUsername = prompt('Enter current username:');
    const currentPassword = prompt('Enter current password:');
    
    const adminAccount = JSON.parse(localStorage.getItem('adminAccount'));
    
    if (currentUsername === adminAccount.username && currentPassword === adminAccount.password) {
        const newUsername = prompt('Enter new username:');
        const newPassword = prompt('Enter new password:');
        
        if (newUsername && newPassword) {
            const updatedAdmin = {
                username: newUsername,
                password: newPassword
            };
            
            localStorage.setItem('adminAccount', JSON.stringify(updatedAdmin));
            
            // Update current session
            const currentAdmin = JSON.parse(localStorage.getItem('currentAdmin'));
            currentAdmin.username = newUsername;
            localStorage.setItem('currentAdmin', JSON.stringify(currentAdmin));
            
            // Update welcome message
            document.getElementById('welcomeAdmin').textContent = `Welcome, ${newUsername}!`;
            
            alert('Admin credentials updated successfully!');
        } else {
            alert('Please enter both username and password.');
        }
    } else {
        alert('Current credentials are incorrect.');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('currentAdmin');
    window.location.href = 'index.html';
}
