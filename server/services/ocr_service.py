from paddleocr import PaddleOCR

ocr = PaddleOCR(use_angle_cls=True, lang='en')

def extract_text_from_image(image_path: str) -> str:
    result = ocr.predict(image_path)
    extracted_text = "\n".join([line[1][0] for line in result[0]])
    return extracted_text