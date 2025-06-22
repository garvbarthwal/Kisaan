# AI Assistant Feature for KisanBazar

## Overview

The AI Assistant feature provides farmers with expert farming advice in their native language using Google's Gemini AI. Farmers can ask questions about crops, farming practices, pest control, government schemes, and more.

## Features

### 🤖 AI-Powered Assistance

- Get expert farming advice using Google Gemini AI
- Responses tailored specifically for Indian farming conditions
- Context-aware answers considering Indian climate, soil, and practices

### 🗣️ Multi-Language Support

- Support for 13 Indian languages:
  - English
  - Hindi (हिंदी)
  - Bengali (বাংলা)
  - Telugu (తెలుగు)
  - Marathi (मराठी)
  - Tamil (தமிழ்)
  - Gujarati (ગુજરાતી)
  - Kannada (ಕನ್ನಡ)
  - Malayalam (മലയാളം)
  - Punjabi (ਪੰਜਾਬੀ)
  - Odia (ଓଡ଼ିଆ)
  - Assamese (অসমীয়া)
  - Urdu (اردو)

### 🎤 Voice Input

- Speech-to-text functionality for asking questions
- Supports voice input in selected language
- Easy-to-use microphone button

### 💬 Interactive Chat Interface

- Real-time conversation with AI
- Chat history to review previous queries
- Clean, modern interface optimized for farmers

### 📱 Quick Access

- Available directly from farmer dashboard
- Quick query suggestions for common farming topics
- Accessible via farmer navigation menu

## Setup Instructions

### Backend Setup

1. Add your Gemini API key to the `.env` file:

   ```env
   GEMINI_API_KEY=your-gemini-api-key-here
   ```

2. The Google Generative AI package is already installed in the API dependencies.

### Frontend Features

- AI Redux slice for state management
- Speech recognition for voice input
- Language selection dropdown
- Conversation history
- Sample query suggestions

## API Endpoints

### POST /api/ai/ask

Ask the AI a farming question.

**Headers:**

- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Body:**

```json
{
  "query": "What is the best time to plant rice?",
  "language": "hi"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "query": "What is the best time to plant rice?",
    "answer": "Rice planting timing depends on your region...",
    "language": "hi"
  }
}
```

### GET /api/ai/languages

Get supported languages.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "code": "en",
      "name": "English",
      "nativeName": "English"
    },
    {
      "code": "hi",
      "name": "Hindi",
      "nativeName": "हिंदी"
    }
  ]
}
```

### GET /api/ai/history

Get query history (placeholder for future implementation).

## Usage

### For Farmers

1. **Access AI Assistant:**

   - From farmer dashboard, click on the "AI Assistant" card
   - Or use the navigation menu > AI Assistant

2. **Select Language:**

   - Choose your preferred language from the dropdown
   - The AI will respond in the same language

3. **Ask Questions:**

   - Type your question in the input field
   - Or click the microphone button to speak your question
   - Press Send or Enter to submit

4. **Sample Questions:**

   - Use the quick query suggestions for common topics
   - Categories include: Seasonal Farming, Pest Control, Government Schemes, Water Management

5. **Review History:**
   - View your previous conversations
   - Access conversation history sidebar

### Sample Queries

- "What is the best time to plant tomatoes in Maharashtra?"
- "How to control aphids on cotton plants?"
- "What government subsidies are available for drip irrigation?"
- "Organic farming methods for wheat cultivation"
- "How to prepare soil for monsoon crops?"

## Technical Implementation

### Backend

- **Controller:** `api/controllers/aiController.js`
- **Routes:** `api/routes/aiRoutes.js`
- **Middleware:** Farmer authentication required

### Frontend

- **Redux Slice:** `client/src/redux/slices/aiSlice.js`
- **Main Component:** `client/src/pages/farmer/AiAssistantPage.jsx`
- **Routing:** Added to farmer routes in `App.jsx`
- **Navigation:** Added to farmer dropdown and mobile menu

### Key Features Implementation

- **Speech Recognition:** Uses Web Speech API
- **Language Support:** Dynamic language switching
- **Real-time Chat:** Instant AI responses
- **Responsive Design:** Works on mobile and desktop

## Security & Access Control

- Only authenticated farmers can access the AI assistant
- API routes protected with farmer-specific middleware
- Rate limiting can be implemented for API calls

## Future Enhancements

- Database storage for conversation history
- AI response caching for common queries
- Integration with weather data for location-specific advice
- Image recognition for crop disease diagnosis
- Push notifications for seasonal farming tips

## Error Handling

- Network error handling with user-friendly messages
- Speech recognition error handling
- API rate limit handling
- Fallback to English if language not supported

## Browser Compatibility

- Speech recognition works in Chrome, Edge, Safari
- Fallback to text input if speech API not available
- Progressive enhancement for older browsers
