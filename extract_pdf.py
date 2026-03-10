import PyPDF2

# Open the PDF file
with open(r"c:\Users\gaurt\Downloads\11Planner\Design Document (1).pdf", 'rb') as file:
    pdf_reader = PyPDF2.PdfReader(file)
    
    # Get pages 11 and 12 (index 10 and 11)
    page_11 = pdf_reader.pages[10].extract_text()
    page_12 = pdf_reader.pages[11].extract_text()
    
    print("====== PAGE 11 ======")
    print(page_11)
    print("\n\n====== PAGE 12 ======")
    print(page_12)
