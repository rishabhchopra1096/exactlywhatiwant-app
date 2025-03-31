# ExactlyWhatIWant App

A design customization platform using AI to help users create and visualize custom product designs through natural language conversation.

## Features

- **AI-Powered Design Creation**: Chat with the AI to create and modify designs
- **Real-time Visualization**: See your designs applied to different products instantly
- **Multiple Product Types**: Support for T-shirts, shirts, bottles, hoodies, and notebooks
- **Image Processing**: Upload and modify images with the Gemini API
- **Video Generation**: Create realistic product videos showcasing your designs in 3D

## Getting Started

First, set up your environment variables in `.env.local`:

```bash
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id

# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Replicate API (for video generation)
REPLICATE_API_TOKEN=your_replicate_api_token
```

Then, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Video Generation Feature

The app includes a feature to generate realistic product videos using the Replicate WAN-2 model:

1. Upload an image or generate a design through the chat interface
2. Click the video icon button in the chat input area
3. Wait while the AI generates a realistic 3D video of your product
4. View and download the video for use in marketing or presentations

The video generation feature requires a valid Replicate API token to work properly.

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Google AI (Gemini) API](https://ai.google.dev/)
- [Replicate API](https://replicate.com/docs)
- [WAN-2 Image-to-Video Model](https://replicate.com/wavespeedai/wan-2.1-i2v-480p)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
