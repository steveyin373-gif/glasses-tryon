from rembg import remove
from PIL import Image
import os, io

def extract_front(input_path, output_path, crop_sides_pct=0.08):
    """Remove background and crop off temple arms from sides."""
    with open(input_path, "rb") as f:
        output_data = remove(f.read())
    img = Image.open(io.BytesIO(output_data)).convert("RGBA")

    # First crop to content bounding box
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    # Then trim extra from left and right to remove temple arms
    w, h = img.size
    trim = int(w * crop_sides_pct)
    img = img.crop((trim, 0, w - trim, h))

    img.save(output_path, "PNG")
    print(f"Front: {output_path} ({img.size[0]}x{img.size[1]})")

def extract_side(input_path, output_path):
    """Remove background from side view."""
    with open(input_path, "rb") as f:
        output_data = remove(f.read())
    img = Image.open(io.BytesIO(output_data)).convert("RGBA")
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    img.save(output_path, "PNG")
    print(f"Side: {output_path} ({img.size[0]}x{img.size[1]})")

if __name__ == "__main__":
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models = os.path.join(base, "public", "models")
    extract_front(os.path.join(models, "glasses1.jpg"), os.path.join(models, "glasses1_front.png"))
    extract_side(os.path.join(models, "glasses2.jpg"), os.path.join(models, "glasses2_side.png"))
