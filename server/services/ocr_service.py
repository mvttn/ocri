from paddleocr import PaddleOCR

ocr = PaddleOCR(use_angle_cls=True, lang='en')

def extract_text_from_image(image_path: str) -> str:
    result = ocr.ocr(image_path)
    text = ""
    for line in result:
        for word_info in line:
            word_text = word_info[1][0]
            text += word_text + " "
    return text.strip()
