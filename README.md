# Kisaan 🌾

**Kisaan** is a comprehensive agricultural marketplace platform that connects farmers directly with consumers, eliminating middlemen and empowering local agriculture. Built with modern technologies and AI-powered features, it provides a complete ecosystem for sustainable farm-to-table commerce.

---

## 🎯 Vision

Transforming agriculture by creating a direct bridge between farmers and consumers, fostering trust, transparency, and sustainable farming practices while ensuring fair prices for both parties.

---

## 🚀 Core Features

### 🌱 **Smart Marketplace**

- **Multi-role System** — Farmers, Consumers, and Admins with specialized dashboards
- **Product Management** — Complete CRUD operations with image upload, categorization, and inventory tracking
- **Advanced Search & Filtering** — Search by category, location, farmer, price range, and organic options
- **Order Management** — Full order lifecycle from placement to delivery/pickup completion
- **Review & Rating System** — Trust-building through consumer feedback

### 🤖 **AI-Powered Intelligence**

- **Multilingual AI Assistant** — Google Gemini-powered farming advice in 11+ Indian languages
- **Smart Inventory Management** — AI-driven stock tracking and automated inventory updates
- **Voice Integration** — Complete speech-to-text and text-to-speech in multiple languages
- **Intelligent Query Processing** — Natural language understanding for farming queries and commands
- **Contextual Responses** — AI provides tailored advice based on farmer's location and crops

### 🗣️ **Advanced Communication**

- **Real-time Messaging** — Direct farmer-consumer communication with message history
- **Voice Features** — Voice input/output with customizable settings and language-specific synthesis
- **Multilingual Support** — 11+ Indian languages with automatic translation
- **Notification System** — Real-time updates for orders, messages, verification status, and system events

### 🚚 **Flexible Fulfillment**

- **Dual Delivery Options** — Pickup and delivery with configurable schedules and pricing
- **Business Hours Management** — Farmers can set custom pickup hours or use standard business hours
- **GPS Location Services** — Precise location detection for accurate deliveries and farmer discovery
- **Smart Scheduling** — Time-slot based pickup system with availability validation
- **Delivery Zones** — Geographic area management for delivery services

### 🔐 **Security & Verification**

- **OTP-based Authentication** — Twilio-powered SMS verification for secure login
- **Farmer Verification** — Government data integration with mock system for authenticity
- **JWT Security** — Secure token-based authentication with role-based access control
- **Verified Badges** — Trust indicators for verified farmers and authentic products

### 🌍 **Location Intelligence**

- **GPS Integration** — Automatic location detection with high accuracy
- **Address Geocoding** — Convert coordinates to human-readable addresses
- **Regional Optimization** — Optimized for Indian locations and addressing systems
- **Delivery Zone Management** — Smart delivery area calculations and farmer proximity

### 📱 **User Experience**

- **Responsive Design** — Mobile-first approach with Tailwind CSS for all screen sizes
- **Progressive Features** — Voice controls, offline capabilities, and accessibility features
- **Real-time Updates** — Live notifications, order status updates, and inventory changes
- **Intuitive Navigation** — Role-based interfaces optimized for different user types

---

## 🛠️ Technology Stack

### **Frontend**

- **React 18** with hooks, Redux Toolkit for state management
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for responsive and modern styling
- **React Router** for navigation and protected routes
- **i18next** for internationalization across 13+ languages
- **Web Speech API** for voice recognition and synthesis

### **Backend**

- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM for data modeling
- **JWT** for authentication and session management
- **Cloudinary** for image storage and optimization
- **Twilio** for SMS and OTP services

### **AI & Voice Technologies**

- **Google Gemini AI** for intelligent farming assistance and natural language processing
- **Text-to-Speech & Speech-to-Text** with multi-language support
- **Smart Response Generation** for contextual AI conversations

### **Infrastructure & Deployment**

- **Vercel** for seamless deployment and hosting
- **RESTful API** architecture with comprehensive error handling
- **Environment-based Configuration** for secure production deployments

---

## 🌐 Supported Languages

Kisaan supports **13+ Indian languages** with full localization:

- **English** (en) - Primary language
- **Hindi** (hi) - हिंदी
- **Bengali** (bn) - বাংলা
- **Telugu** (te) - తెలుగు
- **Marathi** (mr) - मराठी
- **Tamil** (ta) - தமிழ்
- **Gujarati** (gu) - ગુજરાતી
- **Kannada** (kn) - ಕನ್ನಡ
- **Malayalam** (ml) - മലയാളം
- **Punjabi** (pa) - ਪੰਜਾਬੀ
- **Odia** (or) - ଓଡ଼ିଆ
- **Assamese** (as) - অসমীয়া
- **Urdu** (ur) - اردو

---

## �️ Project Structure

```
Kisaan/
├── api/                           # Backend API Server
│   ├── controllers/              # Business logic and API handlers
│   ├── models/                   # Database schemas and models
│   ├── routes/                   # API route definitions
│   ├── utils/                    # Helper functions and middleware
│   └── index.js                  # Server entry point
├── client/                       # Frontend React Application
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── pages/               # Application pages and views
│   │   ├── redux/               # State management (Redux Toolkit)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── utils/               # Helper utilities and services
│   │   └── i18n/                # Internationalization files
│   └── package.json
├── docs/                         # Documentation and setup guides
└── README.md                     # Project overview and introduction
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- Git (optional)

### Quick Setup

Before setting up the project, please read the following documentation files:

📋 **Required Reading:**

1. **[Setup Instructions](./docs/setup-instructions.md)** - Complete installation and configuration guide
2. **[MongoDB Setup](./docs/mongodb-setup-instructions.md)** - Database configuration and mock data seeding
3. **[Twilio Setup Guide](./docs/twilio-setup-guide.md)** - SMS and OTP service configuration
4. **[Mock Government Data](./docs/mock-government-data.md)** - Farmer verification testing guide

### Key Configuration Notes

- **Twilio Testing**: Replace one mock data entry with your phone number to test SMS functionality
- **Database**: Can use local MongoDB or MongoDB Atlas (recommended)
- **AI Features**: Requires Google Gemini API key for full AI assistant functionality
- **Image Upload**: Requires Cloudinary configuration for product image storage

---

## 🎯 Key Use Cases

### For Farmers

- **Verification & Trust Building** - Get verified through government data integration
- **Product Management** - List products with detailed descriptions, pricing, and fulfillment options
- **Order Processing** - Manage incoming orders with flexible delivery/pickup scheduling
- **AI-Powered Assistance** - Get farming advice, manage inventory through voice commands
- **Customer Communication** - Direct messaging with consumers for better service

### For Consumers

- **Local Discovery** - Find verified farmers and fresh produce in your area
- **Smart Shopping** - Advanced search, filtering, and comparison features
- **Flexible Fulfillment** - Choose between pickup and delivery based on preference
- **Trust & Transparency** - Verified farmer badges, reviews, and direct communication
- **Multi-language Support** - Shop in your preferred Indian language

### For Platform Administrators

- **User Management** - Oversee farmer verification and user activities
- **Content Moderation** - Manage products, categories, and platform quality
- **Analytics & Insights** - Monitor platform performance and user engagement
- **System Configuration** - Manage notifications, categories, and platform settings

---

## 🤝 Contributing

We welcome contributions to improve the Kisaan platform! Whether it's bug fixes, feature enhancements, or documentation improvements, your contributions are valuable.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📧 Contact

For questions, feedback, or collaboration opportunities:

**Email:** [adityajolly16@gmail.com](mailto:adityajolly16@gmail.com)

**GitHub:** [AdityaJollyy](https://github.com/AdityaJollyy)

---

> **Built with ❤️ for Indian Agriculture**  
> _Empowering farmers, connecting communities, and promoting sustainable agriculture through technology_
