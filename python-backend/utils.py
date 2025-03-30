import os
import uuid
import io
import base64
from PIL import Image

def ensure_static_dir(app_static_folder):
    """Ensure the static directory exists
    
    Args:
        app_static_folder (str): Path to the static folder
        
    Returns:
        str: Path to the static directory
    """
    if not os.path.exists(app_static_folder):
        os.makedirs(app_static_folder)
    
    return app_static_folder

def save_binary_file(data, mime_type, static_folder):
    """Save binary data to a file with a unique name based on mime type
    
    Args:
        data (bytes): Binary data to save
        mime_type (str): MIME type of the data (e.g., 'image/jpeg')
        static_folder (str): Directory to save the file in
        
    Returns:
        tuple: (file_path, file_url) - Path to the saved file and URL to access it
    """
    extension = mime_type.split("/")[1]
    file_name = f"generated_{uuid.uuid4()}.{extension}"
    file_path = os.path.join(static_folder, file_name)
    
    with open(file_path, "wb") as f:
        f.write(data)
    
    # URL to access the file
    file_url = f"/static/{file_name}"
    
    return file_path, file_url

def process_base64_image(base64_image):
    """Process a base64 encoded image
    
    Args:
        base64_image (str): Base64 encoded image data
        
    Returns:
        dict: Dictionary with image data
    """
    # Remove data URL prefix if present
    if "," in base64_image:
        base64_image = base64_image.split(",")[1]
    
    # Decode base64 to binary
    image_data = base64.b64decode(base64_image)
    
    try:
        # Try to open the image to validate it
        image = Image.open(io.BytesIO(image_data))
        
        return {
            "data": image_data,
            "format": image.format or "JPEG",
            "mime_type": f"image/{image.format.lower() if image.format else 'jpeg'}"
        }
    except Exception as e:
        raise ValueError(f"Invalid image data: {str(e)}")

def base64_to_image(base64_image):
    """Convert base64 image to PIL Image
    
    Args:
        base64_image (str): Base64 encoded image data
        
    Returns:
        PIL.Image: PIL Image object
    """
    # Remove data URL prefix if present
    if "," in base64_image:
        base64_image = base64_image.split(",")[1]
    
    # Decode base64 to binary
    image_data = base64.b64decode(base64_image)
    
    # Create PIL Image
    return Image.open(io.BytesIO(image_data))

def image_to_base64(image, format="JPEG"):
    """Convert PIL Image to base64
    
    Args:
        image (PIL.Image): PIL Image object
        format (str, optional): Image format. Defaults to "JPEG".
        
    Returns:
        str: Base64 encoded image data with data URL prefix
    """
    # Convert PIL Image to bytes
    buffer = io.BytesIO()
    image.save(buffer, format=format)
    img_bytes = buffer.getvalue()
    
    # Encode bytes to base64
    img_base64 = base64.b64encode(img_bytes).decode('utf-8')
    
    # Add data URL prefix
    mime_type = f"image/{format.lower()}"
    data_url = f"data:{mime_type};base64,{img_base64}"
    
    return data_url 