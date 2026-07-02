# بوابة القبول الموحد - جامعة الملك سعود
# King Saud University - Unified Admission Portal

A comprehensive, production-ready Student Registration Portal for King Saud University (KSU) built with modern web technologies.

## 🌟 Features

### 1. Authentication System
- **Sign-Up Page**: Complete registration with:
  - Full Name (Arabic/English)
  - National ID / Iqama Number (10-digit validation)
  - Email validation
  - Saudi mobile number format validation
  - Strong password criteria (8+ chars, uppercase, lowercase, number, special character)
  - Terms and conditions acceptance

- **Login Page**: Secure authentication with:
  - National ID or Email login
  - Password field with show/hide toggle
  - "Remember Me" functionality
  - Forgot Password flow
  - Multi-Factor Authentication (MFA) placeholder

### 2. Personal & Academic Data Wizard
Multi-step form collecting:
- Personal Details (Gender, Birth Date, City, Marital Status)
- Academic Details:
  - High School Graduation Year
  - High School Type
  - High School GPA
  - Qudurat (قدرات) Score
  - Tahsili (تحصيلي) Score
- **Real-time Weighted Average Calculation** using KSU's standard formula:
  ```
  Weighted Average = (GPA × 40%) + (Qudurat × 30%) + (Tahsili × 30%)
  ```

### 3. KSU Tracks & Colleges Admission System
Dynamic track filtering based on calculated Weighted Average:
- **Health Track (المسار الصحي)**: Medicine, Dentistry, Pharmacy, Applied Medical Sciences (Min: 90%)
- **Engineering & Science Track (المسار الهندسي والعلمي)**: Computer Science, Cybersecurity, Civil Engineering, Electrical Engineering, Mechanical Engineering (Min: 85%)
- **Humanities Track (المسار الإنساني)**: Law, Business Administration, Languages, Arts, Education (Min: 70%)

Features:
- Dynamic filtering by track, minimum percentage, and eligibility
- Preference ordering system (drag-and-drop style)
- Up to 5 preferences per student
- Real-time eligibility checking

### 4. Tuition Fees & Finance Module
Comprehensive fee structure display:
- Detailed data table showing fees for all tracks/colleges
- Differentiated pricing:
  - Saudi citizens (government-funded - free tuition)
  - Non-Saudi citizens (full tuition fees)
  - Diploma programs
  - Application processing fees (100 SAR)
- Itemized invoice before payment

### 5. Secure Payment Gateway
Premium checkout interface with:
- **Payment Methods**:
  - Mada (مدى) - Saudi national payment network
  - Visa/MasterCard - International cards
  - Apple Pay - Contactless payment
- **Features**:
  - Auto-detect card brand
  - Card number formatting
  - Expiry date formatting (MM/YY)
  - CVV validation
  - Secure SSL encryption indicator
  - Success/Receipt state after payment

### 6. Receipt & Confirmation
- Detailed payment receipt with:
  - Transaction ID
  - Payment confirmation
  - Academic summary
  - Registered preferences
  - Print functionality
  - Download as text/PDF

## 🎨 Design & Branding

### KSU Identity Colors
- **Primary Green**: `#006837` (KSU Green)
- **Dark Green**: `#004d29` (KSU Dark Green)
- **Light Green**: `#2d8a4e` (KSU Light Green)
- **Gold Accent**: `#D4AF37` (KSU Gold)
- **White**: `#ffffff`

### Typography
- **Font**: Tajawal (Google Fonts)
- **Language**: Full Arabic localization (RTL support)
- **Professional academic Arabic language throughout

### UI/UX Features
- Modern, clean, trustworthy interface
- Responsive design (mobile, tablet, desktop)
- Smooth animations and transitions
- Intuitive wizard progress indicators
- Clear visual hierarchy
- Accessible color contrasts

## 🔒 Security Features

### Client-Side Security
- **Input Sanitization**: XSS protection for all user inputs
- **Form Validation**: Comprehensive validation for all fields
- **Rate Limiting**: Protection against brute force attacks
- **CSRF Protection**: Token-based security (placeholder)
- **Password Strength**: Strong password requirements

### Data Protection
- Secure data handling
- Encrypted connection indicators
- Sensitive data masking in receipts
- Local storage for demo purposes (production would use secure backend)

## 📁 Project Structure

```
ksu-admission-portal/
├── index.html              # Landing page
├── signup.html             # Registration page
├── login.html              # Login page
├── academic-data.html      # Academic data wizard
├── tracks.html             # Tracks and preferences
├── fees.html               # Fee structure and invoice
├── payment.html            # Payment gateway
├── receipt.html            # Payment receipt
├── styles.css              # Custom styles and KSU branding
├── app.js                  # Core application logic
├── signup.js               # Signup form handler
├── login.js                # Login form handler
├── academic-data.js        # Academic data and weighted average
├── tracks.js               # Tracks and preferences system
├── fees.js                 # Fee calculation module
├── payment.js              # Payment processing
├── receipt.js              # Receipt generation
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No build tools required (uses CDN for Tailwind CSS)

### Installation
1. Clone or download the project
2. Open `index.html` in a web browser
3. No additional setup required

### Usage Flow
1. **Landing Page**: Review information and click "إنشاء حساب جديد"
2. **Sign-Up**: Create account with personal information
3. **Login**: Sign in with credentials (MFA verification)
4. **Academic Data**: Enter academic information (weighted average auto-calculated)
5. **Tracks**: View eligible tracks and select preferences
6. **Fees**: Review fee structure and invoice
7. **Payment**: Complete secure payment
8. **Receipt**: View and download payment receipt

## 🛠️ Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Custom styling with Tailwind CSS
- **JavaScript (ES6+)**: Application logic
- **Tailwind CSS**: Utility-first CSS framework (via CDN)
- **Google Fonts**: Tajawal font for Arabic typography
- **Local Storage**: Client-side data persistence (demo)

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers (1920px+)
- Laptops (1366px - 1920px)
- Tablets (768px - 1366px)
- Mobile devices (< 768px)

## 🔧 Customization

### Modifying KSU Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --ksu-green: #006837;
    --ksu-dark-green: #004d29;
    --ksu-light-green: #2d8a4e;
    --ksu-gold: #D4AF37;
}
```

### Adjusting Weighted Average Formula
Edit the calculation in `app.js`:
```javascript
const weightedAverage = (gpa * 0.40) + (qudurat * 0.30) + (tahsili * 0.30);
```

### Updating Fee Structure
Edit the fee table in `fees.html` and fee calculation in `fees.js`

### Modifying Track Requirements
Edit track data in `tracks.js`:
```javascript
const tracksData = {
    health: {
        minPercentage: 90,
        colleges: [...]
    }
};
```

## 🌐 Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📝 Notes

### Production Deployment
For production deployment, this frontend should be connected to:
- Secure backend API (Node.js, Python, PHP, etc.)
- Database (PostgreSQL, MySQL, MongoDB)
- Payment gateway API (Mada, Visa, Apple Pay)
- Authentication service (OAuth, JWT)
- Email service for confirmations

### Current Limitations (Demo Version)
- Data stored in localStorage (not secure for production)
- Payment processing is simulated
- MFA is placeholder (demo code: 123456)
- No actual backend integration
- No email sending functionality

### Security Recommendations for Production
- Implement server-side validation
- Use HTTPS only
- Implement proper session management
- Add CAPTCHA for form submissions
- Use prepared statements for database queries
- Implement proper authentication (JWT, OAuth)
- Add logging and monitoring
- Regular security audits

## 🤝 Support

For questions or issues:
- Email: admission@ksu.edu.sa (placeholder)
- KSU Admission Office contact information

## 📄 License

This project is for demonstration purposes for King Saud University.
All rights reserved © 2026

---

**Built with ❤️ for King Saud University**
