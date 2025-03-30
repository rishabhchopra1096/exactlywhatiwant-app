import os
import base64
import uuid
import io
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from PIL import Image
import traceback

# Import our utility modules
import utils
import gemini_api

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__, static_folder='static')

# Configure CORS to allow requests from our Next.js frontend
CORS(app, resources={r"/*": {"origins": os.getenv("CORS_ORIGIN", "http://localhost:3000")}})

# Ensure the static directory exists
utils.ensure_static_dir(app.static_folder)

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        "status": "ok",
        "message": "Python backend is running",
        "gemini_api_key_configured": bool(os.getenv("GEMINI_API_KEY"))
    })

@app.route('/process-image', methods=['POST'])
def process_image():
    """Process an image with Gemini API
    
    Expected JSON payload:
    {
        "image": "base64_encoded_image_data",
        "prompt": "user text prompt",
        "chatHistory": [optional list of previous messages]
    }
    """
    try:
        data = request.json
        
        if not data or 'image' not in data or 'prompt' not in data:
            return jsonify({
                "error": "Missing required fields: 'image' and 'prompt' are required"
            }), 400
        
        # Process the image
        try:
            image_data = utils.process_base64_image(data['image'])
        except ValueError as e:
            return jsonify({"error": f"Invalid image data: {str(e)}"}), 400
        
        # Get chat history if provided
        chat_history = data.get('chatHistory', [])
        
        # Call Gemini API
        response_text, response_image, response_mime_type = gemini_api.generate_response(
            image_data=image_data['data'],
            prompt=data['prompt'],
            messages=chat_history
        )
        
        result = {
            "text": response_text,
            "image": None
        }
        
        # If we got an image back, save it and return the URL
        if response_image and response_mime_type:
            _, file_url = utils.save_binary_file(
                data=response_image,
                mime_type=response_mime_type,
                static_folder=app.static_folder
            )
            
            # Convert image to base64 for frontend
            image = Image.open(io.BytesIO(response_image))
            image_base64 = utils.image_to_base64(image)
            
            result["image"] = image_base64
        
        return jsonify(result)
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": f"Error processing image: {str(e)}"
        }), 500

# Serve static files
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port) 