from fastapi import APIRouter, UploadFile, File
from fastapi.responses import FileResponse
import aiofiles
import os
from datetime import datetime
from asyncio import get_event_loop

router = APIRouter(prefix="/api/ocr", tags=["OCR"])

# Folder where uploaded images will be saved
SAVE_DIR = "/tmp/uploads"
os.makedirs(SAVE_DIR, exist_ok=True)

@router.post("/")
async def ocr_image(file: UploadFile = File(...)):
    """
    Accepts an uploaded image, saves it to the server, and returns the file path and URL.
    """
    # Add timestamp to avoid filename collisions
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    save_path = os.path.join(SAVE_DIR, filename)

    async with aiofiles.open(save_path, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)

    # Optionally, you can run OCR here with extract_text_from_image(save_path)
    # loop = get_event_loop()
    # text = await loop.run_in_executor(None, extract_text_from_image, save_path)

    return {
        "saved_to": save_path,
        "url": f"/api/ocr/uploads/{filename}",
        # "text": text  # Uncomment when OCR is ready
    }

@router.get("/uploads/{filename}")
async def get_image(filename: str):
    """
    Serves a saved image so it can be viewed in a browser.
    """
    file_path = os.path.join(SAVE_DIR, filename)
    if not os.path.exists(file_path):
        return {"error": "File not found"}
    return FileResponse(file_path)
