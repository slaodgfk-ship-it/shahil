# College Student Portal

A comprehensive web application for college students with multiple features including issue reporting, cafeteria food ordering, lost & found portal, transport sharing, and feedback system.

## Features

### For Students:
1. **User Authentication**
   - Login with username and password
   - Sign up with college email, room number, course, year, and mobile number
   - Secure session management

2. **Cafeteria Food Ordering Platform**
   - Browse food menu with categories
   - Add items to cart
   - Place orders with real-time status tracking

3. **Lost and Found Portal**
   - Report lost items with detailed descriptions
   - Report found items to help others
   - Browse all lost and found items

4. **Sustainable Transport Sharing**
   - Offer rides to other students
   - Search and book available rides
   - Eco-friendly transportation solution

5. **Student Feedback System**
   - Submit feedback with ratings (1-5 stars)
   - Multiple categories (Academic, Infrastructure, etc.)
   - Help improve college services

6. **Issue Reporting System**
   - Report problems with photos, location, and category
   - Track issue status (Pending, In Progress, Resolved)
   - Upvote common issues to highlight priority
   - Add comments on issues

7. **Dashboard Overview**
   - Statistics of your activities
   - Recent activity tracking
   - Quick access to all features

### For Administrators:
1. **Signup Approval System**
   - Review pending student registrations
   - Approve or reject signup requests
   - Filter by course, year, and search criteria
   - View detailed signup information

2. **Advanced Student Management**
   - View all registered students with activity status
   - **Block/Unblock students** - Prevent login while keeping data
   - Remove students and all their data
   - Reset student passwords
   - Export student data to CSV
   - Filter by course, year, status (active/blocked/new), and search terms
   - View student statistics and activity summaries
   - Track block history and reasons

3. **Issue Management**
   - View all reported issues with priority sorting
   - Update issue status (Pending → In Progress → Resolved)
   - Filter by category, priority, and status
   - Delete inappropriate issues
   - Track resolution rates

4. **Food Order Management**
   - Monitor all food orders in real-time
   - Update order status (Pending → Preparing → Ready → Delivered)
   - Filter orders by status and date
   - View order analytics

5. **Feedback Monitoring**
   - Review all student feedback with ratings
   - Filter by category and rating
   - Analyze satisfaction trends
   - Generate feedback reports

6. **Lost & Found Management**
   - Monitor lost and found reports
   - Remove resolved or inappropriate items
   - Separate views for lost vs found items

7. **Advanced Analytics Dashboard**
   - Registration trends and statistics
   - Issue category breakdown with visual indicators
   - Course distribution analysis
   - Activity metrics (avg issues/orders per student)
   - Resolution rate tracking
   - Comprehensive reporting system

8. **Report Generation**
   - Monthly activity reports
   - Issue analysis reports
   - Feedback summary reports
   - Student activity reports
   - Data export capabilities

## Getting Started

### Prerequisites
- Web browser (Chrome, Firefox, Safari, Edge)
- Local web server (XAMPP, WAMP, or similar) - optional for local development

### Installation

1. **Download/Clone the project**
   - Place all files in your web server directory (e.g., `htdocs` for XAMPP)

2. **Start your web server**
   - If using XAMPP, start Apache
   - If using a simple setup, you can open `index.html` directly in your browser

3. **Access the application**
   - Open your web browser
   - Navigate to `http://localhost/hackathon demo/index.html`
   - Or directly open `index.html` if not using a web server

### Default Admin Credentials
- **Username:** admin
- **Password:** admin123

## Usage Guide

### For Students:

1. **First Time Setup:**
   - Click "Sign up here" on the login page
   - Fill in all required information
   - Use your college email address
   - Create a secure password (minimum 6 characters)

2. **Logging In:**
   - Enter your username and password
   - Click "Sign In"

3. **Reporting Issues:**
   - Go to "Report Issues" section
   - Select appropriate category and priority
   - Provide detailed description and location
   - Optionally upload a photo
   - Submit the report

4. **Ordering Food:**
   - Navigate to "Cafeteria" section
   - Browse available items
   - Add items to cart
   - Review your order and place it

5. **Using Lost & Found:**
   - Report lost items with detailed descriptions
   - Report found items to help others
   - Browse existing reports to find your items

6. **Transport Sharing:**
   - Offer rides by providing route and timing details
   - Search for available rides
   - Book rides offered by other students

### For Administrators:

1. **Logging In:**
   - Click "Admin Login" on the main page
   - Use admin credentials (admin/admin123)
   - Access the comprehensive admin panel

2. **Managing Signup Requests:**
   - Go to "Pending Signups" section
   - Review student registration requests
   - Approve legitimate students or reject spam
   - Use filters to find specific requests
   - View detailed student information before approval

3. **Advanced Student Management:**
   - Navigate to "Manage Students" section
   - View all registered students with activity indicators (NEW/ACTIVE/BLOCKED)
   - Use search and filters to find specific students
   - **Block students** - Prevents login while preserving all data and history
   - **Unblock students** - Restores access and maintains block history
   - Export student data for external analysis
   - Remove problematic students (permanently deletes all their data)
   - Reset student passwords when needed
   - View comprehensive student statistics including blocked count

4. **Managing Issues:**
   - View all reported issues in "Manage Issues"
   - Update status as work progresses (Pending → In Progress → Resolved)
   - Use multiple filters (status, category, priority)
   - Delete spam or inappropriate issues
   - Track resolution rates and performance

5. **Monitoring Orders:**
   - Track all food orders in real-time
   - Update order status to keep students informed
   - Filter orders by date or status
   - Monitor order trends and patterns

6. **Reviewing Feedback:**
   - Read all student feedback with ratings
   - Identify areas for improvement
   - Filter by category or rating
   - Generate detailed feedback reports

7. **Analytics and Reporting:**
   - Access "Analytics" section for detailed insights
   - View registration trends and course distributions
   - Monitor issue categories and resolution rates
   - Generate comprehensive reports:
     - Monthly activity summaries
     - Issue analysis reports
     - Feedback summaries
     - Student activity reports
   - Export data for further analysis

## Technical Details

### Technologies Used:
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Styling:** Custom CSS with modern design patterns
- **Icons:** Font Awesome 6.0
- **Data Storage:** Local Storage (Browser-based)
- **Responsive Design:** Mobile-friendly interface

### Browser Compatibility:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Data Storage:
All data is stored locally in the browser using Local Storage. This means:
- Data persists between sessions
- Data is specific to each browser/device
- No server-side database required
- Easy to reset by clearing browser data

### Security Features:
- Input validation and sanitization
- Session management
- Role-based access control (Student vs Admin)
- Secure password handling

## File Structure

```
hackathon demo/
├── index.html          # Main login/signup page
├── dashboard.html      # Student dashboard
├── admin.html          # Admin panel
├── styles.css          # All CSS styles
├── script.js           # Login/signup functionality
├── dashboard.js        # Student dashboard functionality
├── admin.js           # Admin panel functionality
└── README.md          # This file
```

## Customization

### Adding New Food Items:
Edit the `dashboard.html` file and add new food items in the cafeteria section.

### Modifying Categories:
Update the category options in both HTML files and corresponding JavaScript files.

### Changing Admin Credentials:
Modify the default admin credentials in `script.js` file.

### Styling Changes:
All styles are in `styles.css`. The design uses CSS Grid and Flexbox for responsive layouts.

## Troubleshooting

### Common Issues:

1. **Login not working:**
   - Check if you've created an account first
   - Verify username and password are correct
   - Clear browser cache and try again

2. **Data not saving:**
   - Ensure Local Storage is enabled in your browser
   - Check if you're in private/incognito mode
   - Try a different browser

3. **Admin panel not accessible:**
   - Use correct admin credentials (admin/admin123)
   - Make sure you're clicking "Admin Login" not regular login

4. **Responsive issues:**
   - The design is optimized for screens 320px and above
   - Try refreshing the page
   - Check browser zoom level

### Browser Storage Limits:
- Local Storage typically allows 5-10MB per domain
- If you encounter storage issues, clear browser data
- Consider implementing data export/import features for production use

## Future Enhancements

Potential improvements for production deployment:

1. **Backend Integration:**
   - Replace Local Storage with a proper database
   - Implement server-side authentication
   - Add real-time notifications

2. **Advanced Features:**
   - Push notifications for issue updates
   - Email notifications
   - Mobile app version
   - Payment integration for food orders

3. **Enhanced Security:**
   - Password encryption
   - Two-factor authentication
   - Rate limiting
   - Input sanitization

4. **Analytics:**
   - Advanced reporting
   - Data visualization charts
   - Export functionality

## Support

For technical support or questions:
- Check the troubleshooting section above
- Review the code comments for implementation details
- Test with different browsers if issues persist

## License

This project is created for educational purposes. Feel free to modify and use as needed.

---

**Note:** This application uses browser Local Storage for data persistence. In a production environment, you would want to implement a proper backend with database storage, user authentication, and security measures.
