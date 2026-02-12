from fastapi import APIRouter, File, UploadFile
from app.syllabus_parser import extract_text_from_pdf_bytes, parse_syllabus_text

router = APIRouter(prefix="/api/syllabus", tags=["syllabus"])

@router.post("/parse")
async def parse_syllabus(file: UploadFile = File(...)):
    """Parse a syllabus PDF and extract course information"""
    try:
        # Check file type
        if file.content_type != "application/pdf":
            return {"success": False, "error": "File must be a PDF"}
        
        # Read file content
        file_content = await file.read()
        if not file_content:
            return {"success": False, "error": "File is empty"}
        
        # Extract text from PDF
        try:
            text = extract_text_from_pdf_bytes(file_content)
        except Exception as e:
            return {"success": False, "error": f"Failed to extract text from PDF: {str(e)}"}
        
        if not text or text.strip() == "":
            return {"success": False, "error": "No text could be extracted from the PDF"}
        
        # Parse syllabus text
        try:
            parsed_data = parse_syllabus_text(text)
        except Exception as e:
            return {"success": False, "error": f"Failed to parse syllabus: {str(e)}"}
        
        return {"success": True, "parsed": parsed_data}
    
    except Exception as e:
        return {"success": False, "error": f"Error processing syllabus: {str(e)}"}
