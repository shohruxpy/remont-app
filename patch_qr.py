import re

with open("backend/app/routers/machines_router.py", "r", encoding="utf-8") as f:
    content = f.read()

new_qr = """
@router.post("/qr-sheet")
async def generate_qr_sheet(req: QrSheetRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(admin_required)):
    from fpdf import FPDF
    import os
    pdf = FPDF()
    pdf.add_page()
    font_path = os.path.join(os.path.dirname(__file__), "../../../Roboto-Regular.ttf")
    if os.path.exists(font_path):
        pdf.add_font('Roboto', '', font_path, uni=True)
        pdf.set_font('Roboto', '', 12)
    else:
        pdf.set_font("Arial", size=12)
        
    for code in req.codes:
        res = await db.execute(select(Machine).where(Machine.code == code))
        m = res.scalars().first()
        name = m.name if m else ""
        pdf.cell(200, 10, txt=f"EQ:{code} - {name}", ln=True, align='C')
    
    return Response(content=pdf.output(dest='S'), media_type="application/pdf")

@router.get("/{code}/qr")
async def generate_qr_single(code: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(admin_required)):
    from fpdf import FPDF
    import os
    pdf = FPDF()
    pdf.add_page()
    font_path = os.path.join(os.path.dirname(__file__), "../../../Roboto-Regular.ttf")
    if os.path.exists(font_path):
        pdf.add_font('Roboto', '', font_path, uni=True)
        pdf.set_font('Roboto', '', 12)
    else:
        pdf.set_font("Arial", size=12)
        
    res = await db.execute(select(Machine).where(Machine.code == code))
    m = res.scalars().first()
    name = m.name if m else ""
    pdf.cell(200, 10, txt=f"EQ:{code} - {name}", ln=True, align='C')
    
    return Response(content=pdf.output(dest='S'), media_type="application/pdf")
"""

content = re.sub(r'@router\.post\("/qr-sheet"\).*', new_qr, content, flags=re.DOTALL)

with open("backend/app/routers/machines_router.py", "w", encoding="utf-8") as f:
    f.write(content)
