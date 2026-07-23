from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
import openpyxl

from app.api import deps
from app.models.lead import Lead as LeadModel
from app.models.user import User

router = APIRouter()

@router.get("/excel")
def export_leads_excel(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Export all leads to Excel.
    """
    leads = db.query(LeadModel).all()
    
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Leads"
    
    # Headers
    headers = [
        "Company", "Industry", "Website", "Phone", "Email", 
        "Problem", "Recommended Software", "Lead Score", "Status"
    ]
    ws.append(headers)
    
    # Data
    for lead in leads:
        company = lead.company
        ws.append([
            company.name if company else "",
            company.industry if company else "",
            company.website if company else "",
            lead.phone or (company.phone if company else ""),
            lead.email or (company.email if company else ""),
            lead.problems_identified or "",
            lead.recommended_solution or "",
            lead.lead_score or "",
            lead.status or ""
        ])
        
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    
    headers = {
        'Content-Disposition': 'attachment; filename="Codentra_Lead_Report.xlsx"'
    }
    return StreamingResponse(stream, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
