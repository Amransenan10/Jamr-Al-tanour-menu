import os
from PIL import Image

def make_transparent(input_path, output_path):
    print(f"Loading image from: {input_path}")
    img = Image.open(input_path)
    img = img.convert("RGBA")
    datas = img.getdata()

    # Get the background color from top-left corner
    bg_color = datas[0]
    print(f"Detected background color (top-left): {bg_color}")
    
    # We will use a threshold to handle compression artifacts in the background
    threshold = 45 # tolerance for background color match
    
    new_data = []
    for item in datas:
        # Check if the pixel color is close to the background color
        dist = sum(abs(item[i] - bg_color[i]) for i in range(3))
        if dist < threshold:
            new_data.append((255, 255, 255, 0)) # Fully transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # Crop the image to remove empty space around the logo
    # Get bounding box of non-transparent pixels
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        print("Cropped the image to bounding box of content.")

    img.save(output_path, "PNG")
    print(f"Saved transparent logo to: {output_path}")

input_img = r"C:\Users\Abdulwasea\.gemini\antigravity\brain\a1c814fd-88f1-4773-9f25-e21c14422f5e\media__1785646601318.png"
output_img = r"c:\Users\Abdulwasea\Desktop\jamr altanuor\public\assets\logo.png"

try:
    make_transparent(input_img, output_img)
    # Also overwrite icon-192.png and icon-512.png to keep all icons aligned if needed
    make_transparent(input_img, r"c:\Users\Abdulwasea\Desktop\jamr altanuor\public\assets\icon-192.png")
    make_transparent(input_img, r"c:\Users\Abdulwasea\Desktop\jamr altanuor\public\assets\icon-512.png")
    print("All logos and icons updated successfully.")
except Exception as e:
    print(f"Error: {e}")
