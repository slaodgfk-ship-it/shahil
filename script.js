// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize default admin account if not exists
    if (!localStorage.getItem('adminAccount')) {
        const defaultAdmin = {
            username: 'administrator',
            password: 'SecurePass2024!'
        };
        localStorage.setItem('adminAccount', JSON.stringify(defaultAdmin));
    }

    // Bind form events
    bindFormEvents();
}

function bindFormEvents() {
    // Login form
    const loginForm = document.getElementById('loginFormElement');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Signup form
    const signupForm = document.getElementById('signupFormElement');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    // Admin login form
    const adminLoginForm = document.getElementById('adminLoginFormElement');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
}

// Form switching functions with smooth transitions
function showLogin() {
    switchForm('loginForm');
}

function showSignup() {
    switchForm('signupForm');
}

function showAdminLogin() {
    switchForm('adminLoginForm');
}

function switchForm(targetFormId) {
    const currentForm = document.querySelector('.form-container.active');
    const targetForm = document.getElementById(targetFormId);
    
    if (currentForm) {
        // Add exit animation
        currentForm.style.animation = 'slideOutLeft 0.4s ease-in forwards';
        
        setTimeout(() => {
            hideAllForms();
            targetForm.classList.add('active');
            // Reset animation for entrance
            targetForm.style.animation = 'slideInRight 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
        }, 400);
    } else {
        hideAllForms();
        targetForm.classList.add('active');
    }
}

function hideAllForms() {
    const forms = document.querySelectorAll('.form-container');
    forms.forEach(form => {
        form.classList.remove('active');
        form.style.animation = '';
    });
}

// Login handler
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const loadingOverlay = document.querySelector('#loginForm .form-loading-overlay');

    if (!username || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    // Show loading state
    showFormLoading(submitBtn, loadingOverlay);

    // Simulate network delay for better UX
    setTimeout(() => {
        // Get stored users
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Find user
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            // Check if user is blocked
            if (user.isBlocked) {
                hideFormLoading(submitBtn, loadingOverlay);
                showAlert('Your account has been blocked. Please contact administration.', 'error');
                return;
            }
            
            // Store current user session
            localStorage.setItem('currentUser', JSON.stringify(user));
            showAlert('Login successful!', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            hideFormLoading(submitBtn, loadingOverlay);
            showAlert('Invalid username or password', 'error');
        }
    }, 1200); // Simulate loading time
}

// Signup handler
function handleSignup(e) {
    e.preventDefault();
    
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const roomNo = document.getElementById('roomNo').value;
    const course = document.getElementById('course').value;
    const year = document.getElementById('year').value;
    const mobile = document.getElementById('mobile').value;

    // Validation
    if (!username || !email || !password || !course || !year || !mobile) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    if (!email.includes('@') || !email.includes('.')) {
        showAlert('Please enter a valid email address', 'error');
        return;
    }

    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long', 'error');
        return;
    }

    if (mobile.length < 10) {
        showAlert('Please enter a valid mobile number', 'error');
        return;
    }

    // Get existing users
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if username or email already exists
    if (users.some(u => u.username === username)) {
        showAlert('Username already exists', 'error');
        return;
    }

    if (users.some(u => u.email === email)) {
        showAlert('Email already registered', 'error');
        return;
    }

    // Create new user
    const newUser = {
        id: Date.now().toString(),
        username,
        email,
        password,
        roomNo,
        course,
        year,
        mobile,
        registeredAt: new Date().toISOString()
    };

    // Add to pending signups instead of direct users array
    const pendingSignups = JSON.parse(localStorage.getItem('pendingSignups') || '[]');
    newUser.status = 'pending';
    newUser.submittedAt = new Date().toISOString();
    
    pendingSignups.push(newUser);
    localStorage.setItem('pendingSignups', JSON.stringify(pendingSignups));

    showAlert('Signup request submitted! Please wait for admin approval.', 'success');
    
    // Clear form and switch to login
    document.getElementById('signupFormElement').reset();
    setTimeout(() => {
        showLogin();
    }, 1500);
}

// Admin login handler
function handleAdminLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    if (!username || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    // Get admin account
    const adminAccount = JSON.parse(localStorage.getItem('adminAccount'));
    
    if (username === adminAccount.username && password === adminAccount.password) {
        // Store admin session
        localStorage.setItem('currentAdmin', JSON.stringify({
            username: adminAccount.username,
            role: 'admin',
            loginTime: new Date().toISOString()
        }));
        
        showAlert('Admin login successful!', 'success');
        
        // Redirect to admin panel
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1000);
    } else {
        showAlert('Invalid admin credentials', 'error');
    }
}

// Utility function to show alerts
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

// Add CSS for alert animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Check if user is already logged in
function checkAuthStatus() {
    const currentUser = localStorage.getItem('currentUser');
    const currentAdmin = localStorage.getItem('currentAdmin');
    
    if (currentUser && window.location.pathname.includes('index.html')) {
        window.location.href = 'dashboard.html';
    }
    
    if (currentAdmin && window.location.pathname.includes('index.html')) {
        window.location.href = 'admin.html';
    }
}

// Call auth check on page load
checkAuthStatus();

// Function to update year options based on selected course
function updateYearOptions() {
    const courseSelect = document.getElementById('course');
    const yearSelect = document.getElementById('year');
    const selectedCourse = courseSelect.value;
    
    // Clear existing options
    yearSelect.innerHTML = '<option value="">Year of Course</option>';
    
    if (selectedCourse === 'BCA' || selectedCourse === 'BBA') {
        // 3-year courses
        yearSelect.innerHTML += '<option value="1st Year">1st Year</option>';
        yearSelect.innerHTML += '<option value="2nd Year">2nd Year</option>';
        yearSelect.innerHTML += '<option value="3rd Year">3rd Year</option>';
    } else if (selectedCourse === 'MCA' || selectedCourse === 'MBA') {
        // 2-year courses (typically for master's programs)
        yearSelect.innerHTML += '<option value="1st Year">1st Year</option>';
        yearSelect.innerHTML += '<option value="2nd Year">2nd Year</option>';
    } else if (selectedCourse === 'Computer Science' || selectedCourse === 'Electronics' || selectedCourse === 'Civil') {
        // 4-year courses (engineering)
        yearSelect.innerHTML += '<option value="1st Year">1st Year</option>';
        yearSelect.innerHTML += '<option value="2nd Year">2nd Year</option>';
        yearSelect.innerHTML += '<option value="3rd Year">3rd Year</option>';
        yearSelect.innerHTML += '<option value="4th Year">4th Year</option>';
    }
}

// Loading state helper functions
function showFormLoading(button, overlay) {
    if (button) {
        button.classList.add('loading');
        button.disabled = true;
    }
    if (overlay) {
        overlay.classList.add('active');
    }
}

function hideFormLoading(button, overlay) {
    if (button) {
        button.classList.remove('loading');
        button.disabled = false;
    }
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Reset admin credentials (for emergency use)
function resetAdminCredentials() {
    const confirmation = confirm('Are you sure you want to reset admin credentials to default? This will log out all admin sessions.');
    
    if (confirmation) {
        const defaultAdmin = {
            username: 'administrator',
            password: 'SecurePass2024!'
        };
        
        localStorage.setItem('adminAccount', JSON.stringify(defaultAdmin));
        localStorage.removeItem('currentAdmin');
        
        alert('Admin credentials have been reset to default:\nUsername: administrator\nPassword: SecurePass2024!');
        
        // Redirect to login if on admin page
        if (window.location.pathname.includes('admin.html')) {
            window.location.href = 'index.html';
        }
    }
}
