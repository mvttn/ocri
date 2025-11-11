from paddleocr import PaddleOCR

# Initialize once, can reuse
ocr = PaddleOCR(use_angle_cls=True, lang="en")  # Adjust lang if needed

def extract_text_from_image(image_path: str) -> str:
    """
    Returns extracted text from an image file.
    """
    result = ocr.predict(image_path)
    # Concatenate all detected text
    text_lines = [line[1][0] for page in result for line in page]
    return "\n".join(text_lines)

