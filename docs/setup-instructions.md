# Kisaan Platform Setup Instructions

Complete setup guide for the Kisaan agricultural marketplace platform.

## Prerequisites

- **Node.js** (v16+ recommended)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas account)
- **Git** (optional, for cloning)
- **Code Editor** (VS Code recommended)

## Project Structure

```
Kisaan/
├── api/                     # Backend API (Node.js + Express)
│   ├── controllers/         # Business logic
│   ├── models/             # Database schemas
│   ├── routes/             # API endpoints
│   ├── utils/              # Helper functions
│   └── index.js            # Server entry point
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── redux/          # State management
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Helper utilities
│   │   └── i18n/           # Internationalization
│   └── package.json
├── docs/                   # Documentation
└── README.md
```

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/AdityaJollyy/Kisaan.git
cd Kisaan
```

### 2. Backend Setup (API)

Navigate to the API directory:

```bash
cd api
```

Install dependencies:

```bash
npm install
```

Create a `.env` file with the following configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/kisaan
# For MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/kisaan

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=90d

# AI Integration
GEMINI_API_KEY=your_google_gemini_api_key

# File Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# SMS/OTP Service (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_service_sid
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

Start the backend server:

```bash
npm run dev
```

The API will run on `http://localhost:5000`

### 3. Frontend Setup (Client)

Navigate to the client directory:

```bash
cd ../client
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
# Backend API URL
VITE_API_URL=http://localhost:5000
```

Start the development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Database Setup

### Local MongoDB

1. Install MongoDB Community Edition
2. Start MongoDB service:

   ```bash
   # Windows
   net start MongoDB

   # macOS
   brew services start mongodb/brew/mongodb-community

   # Linux
   sudo systemctl start mongod
   ```

### MongoDB Atlas (Recommended)

1. Create account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster
3. Get connection string
4. Update `MONGO_URI` in backend `.env` file

### Seed Mock Data

Run the seeding script to populate initial data:

```bash
cd api
node seedMockData.js
```

## External Service Configuration

### Required Services

Before running the application, configure these external services:

1. **MongoDB Database** - See [MongoDB Setup Instructions](./mongodb-setup-instructions.md)
2. **Twilio SMS Service** - See [Twilio Setup Guide](./twilio-setup-guide.md)
3. **Government Data Mock** - See [Mock Government Data](./mock-government-data.md)

### Optional Services

1. **Google Gemini AI** - For AI assistant features
2. **Cloudinary** - For image storage and optimization

## Running the Application

1. Start the backend API:

   ```bash
   cd api
   npm run dev
   ```

2. Start the frontend (in a new terminal):

   ```bash
   cd client
   npm run dev
   ```

3. Access the application:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`

## Testing

### Test Accounts

Use the mock government data for testing farmer verification:

- **Mobile**: 9876543210, **Aadhar**: 9123
- **Mobile**: 9123456780, **Aadhar**: 1234
- **Mobile**: 9988776655, **Aadhar**: 2345

**Important**: Replace at least one mock data entry with your own phone number in the database to test Twilio SMS functionality.

### Test Features

1. **User Registration** - Create farmer and consumer accounts
2. **Farmer Verification** - Test OTP verification flow
3. **Product Management** - Add products as a farmer
4. **Order Placement** - Place orders as a consumer
5. **AI Assistant** - Test multilingual farming queries
6. **Voice Features** - Test speech-to-text and text-to-speech
7. **Messaging** - Test farmer-consumer communication

## Development Tips

1. **API Testing**: Use Postman or similar tools to test API endpoints
2. **Database Monitoring**: Use MongoDB Compass for database visualization
3. **Error Debugging**: Check browser console and terminal logs
4. **Hot Reload**: Both frontend and backend support hot reload for development

## Production Deployment

For production deployment:

1. **Environment Variables**: Update all production URLs and API keys
2. **Database**: Use MongoDB Atlas for production database
3. **File Storage**: Configure Cloudinary for image hosting
4. **Domain Setup**: Update CORS settings for your domain
5. **SSL Certificate**: Enable HTTPS for production

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Change PORT in `.env` if 5000 is occupied
2. **Database Connection**: Verify MongoDB is running and connection string is correct
3. **CORS Errors**: Ensure frontend URL is allowed in backend CORS configuration
4. **Image Upload**: Verify Cloudinary configuration for image features
5. **SMS/OTP Issues**: Check Twilio configuration and phone number format

### Getting Help

- Check the [documentation files](./docs/) for specific service setup
- Review the console logs for detailed error messages
- Ensure all environment variables are properly configured

## Next Steps

After successful setup:

1. Explore the farmer dashboard features
2. Test the AI assistant with voice commands
3. Try the multilingual interface
4. Set up real government API integration (replace mock data)
5. Configure production-ready external services
