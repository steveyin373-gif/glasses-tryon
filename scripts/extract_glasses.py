from rembg import remove
from PIL import Image
import os

def extract(input_path, output_path):
    with open(input_path, "rb") as f:
        input_data = f.read()
    output_data = remove(input_data)
    img = Image.open(__import__("io").BytesIO(output_data)).convert("RGBA")
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    img.save(output_path, "PNG")
    print(f"Saved {output_path} ({img.size[0]}x{img.size[1]})")

if __name__ == "__main__":
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models = os.path.join(base, "public", "models")
    extract(os.path.join(models, "glasses1.jpg"), os.path.join(models, "glasses1_front.png"))
    extract(os.path.join(models, "glasses2.jpg"), os.path.join(models, "glasses2_side.png"))
