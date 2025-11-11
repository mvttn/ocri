from fastapi import APIRouter, UploadFile, File
from server.services.ocr_service import extract_text_from_image
import aiofiles
import tempfile
import os
from asyncio import get_event_loop

router = APIRouter(prefix="/api/ocr", tags=["OCR"])

@router.post("/")
async def ocr_image(file: UploadFile = File(...)):
    """
    Accepts an uploaded image and returns extracted text.
    """
    temp_dir = tempfile.gettempdir()
    tmp_path = os.path.join(temp_dir, f"temp_{file.filename}")
    
    try:
        async with aiofiles.open(tmp_path, 'wb') as tmp:
            content = await file.read()
            await tmp.write(content)
        
        # Run CPU-bound OCR in thread pool
        loop = get_event_loop()
        text = await loop.run_in_executor(None, extract_text_from_image, tmp_path)
        return {"text": text}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)