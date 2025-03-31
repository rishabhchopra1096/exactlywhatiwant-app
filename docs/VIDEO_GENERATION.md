# Video Generation Feature Guide

This document provides detailed information about the video generation feature in the ExactlyWhatIWant app.

## Overview

The video generation feature allows you to create realistic 3D videos of your product designs. This is implemented using Replicate's WAN-2 image-to-video model, which transforms a static design image into a dynamic video showing the product from multiple angles.

## Setup Requirements

To use the video generation feature, you need:

1. A Replicate API token (get one at [https://replicate.com](https://replicate.com))
2. Set the API token in your `.env.local` file:
   ```
   REPLICATE_API_TOKEN=your_replicate_api_token_here
   ```

## Using the Video Generation Feature

### From the Chat Interface

1. **Upload or create a design**: Either upload an image or create a design through chat
2. **Click the video button**: Once you have a design, click the video icon (🎬) in the chat input area
3. **Wait for processing**: The system will send your design to the Replicate API and generate a video (this may take 30-60 seconds)
4. **View the result**: The generated video will appear in the chat and can be played directly

### Technical Details

The video generation process:

1. Takes your current design image
2. Creates a prompt based on the selected product type
3. Sends both to the `/api/generate-video` API route
4. Calls the Replicate WAN-2 model with your image and prompt
5. Returns a URL to the generated video

## Supported Product Types

The video generation is optimized for different product types:

- T-shirts
- Shirts
- Bottles
- Hoodies
- Notebooks

The prompts are customized for each product type to ensure realistic visualization.

## Troubleshooting

Common issues:

- **"Failed to generate video"**: Check that your Replicate API token is valid and has sufficient credits
- **Slow generation**: The video generation process can take up to a minute on Replicate's servers
- **Poor quality videos**: Ensure your original design image is high quality and clearly visible
- **No video displays**: Check your browser console for errors and ensure your browser supports the video format

## API Rate Limits

Be aware that Replicate has API rate limits:

- Free tier: Limited number of API calls per day
- Paid tier: Higher limits based on your subscription

Check your Replicate dashboard for your current usage and limits.

## Further Reading

- [Replicate Documentation](https://replicate.com/docs)
- [WAN-2 Model Documentation](https://replicate.com/wavespeedai/wan-2.1-i2v-480p)
- [Image-to-Video Technology](https://replicate.com/collections/image-to-video)
