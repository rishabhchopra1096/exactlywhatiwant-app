import os
import base64
from typing import List, Dict, Any, Tuple, Optional
import google.generativeai as genai
from google.generativeai import types
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def initialize_gemini_client():
    """Initialize the Gemini API client
    
    Returns:
        genai.Client: Initialized Gemini client
    """
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set")
    
    return genai.Client(api_key=api_key)

def generate_response(
    image_data: bytes, 
    prompt: str, 
    messages: Optional[List[Dict[str, Any]]] = None
) -> Tuple[str, Optional[bytes], Optional[str]]:
    """Generate a response from Gemini model
    
    Args:
        image_data (bytes): Binary image data
        prompt (str): The text prompt to send to Gemini
        messages (list, optional): Previous chat history
        
    Returns:
        tuple: (response_text, response_image, response_mime_type)
    """
    try:
        client = initialize_gemini_client()
        model = "gemini-2.0-flash-exp"
        
        # Prepare content parts
        parts = []
        
        # Add image if provided
        if image_data:
            parts.append(
                types.Part.from_bytes(
                    data=image_data,
                    mime_type="image/jpeg"  # Adjust based on image type if needed
                )
            )
        
        # Add text prompt
        parts.append(types.Part.from_text(text=prompt))
        
        # Create content
        contents = [
            types.Content(
                role="user",
                parts=parts,
            )
        ]
        
        # Add chat history if provided
        if messages:
            for message in messages:
                if message.get("role") == "user":
                    # For user messages, we only include text
                    contents.append(
                        types.Content(
                            role="user",
                            parts=[types.Part.from_text(text=message.get("content", ""))]
                        )
                    )
                else:
                    # For model responses, we need to handle both text and images
                    if isinstance(message.get("content"), str):
                        contents.append(
                            types.Content(
                                role="model",
                                parts=[types.Part.from_text(text=message.get("content", ""))]
                            )
                        )
                    elif message.get("content") and message.get("mime_type"):
                        # This is an image response
                        contents.append(
                            types.Content(
                                role="model",
                                parts=[
                                    types.Part.from_bytes(
                                        data=message["content"],
                                        mime_type=message["mime_type"]
                                    )
                                ]
                            )
                        )
        
        # Configure generation
        generate_content_config = types.GenerateContentConfig(
            temperature=1,
            top_p=0.95,
            top_k=40,
            max_output_tokens=8192,
            response_modalities=[
                "text",
                "image"
            ],
            response_mime_type="text/plain",
        )
        
        # Stream response
        response_text = ""
        response_image = None
        response_mime_type = None
        
        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            if not chunk.candidates or not chunk.candidates[0].content or not chunk.candidates[0].content.parts:
                continue
                
            if chunk.candidates[0].content.parts and chunk.candidates[0].content.parts[0].inline_data:
                # This is an image response
                response_image = chunk.candidates[0].content.parts[0].inline_data.data
                response_mime_type = chunk.candidates[0].content.parts[0].inline_data.mime_type
            else:
                # This is a text response
                response_text += chunk.text
        
        return response_text, response_image, response_mime_type
    
    except Exception as e:
        print(f"Error generating response from Gemini: {str(e)}")
        raise 