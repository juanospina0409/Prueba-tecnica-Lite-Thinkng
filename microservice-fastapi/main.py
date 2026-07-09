import io
import os
import time
import hashlib
import requests
import base64
from typing import List, Dict, Optional
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from pathlib import Path

# Cargar variables de entorno del archivo .env que está en la raíz
# Buscamos la raíz subiendo un nivel desde el directorio del microservicio
CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent
ENV_PATH = ROOT_DIR / ".env"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(BASE_DIR)
load_dotenv(dotenv_path=os.path.join(PARENT_DIR, ".env"))

# Forzar la carga y comproba en consola si existe
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
    print(f"[FASTAPI INFO] Archivo .env cargado con éxito desde: {ENV_PATH}")
else:
    print(f"[FASTAPI WARNING] No se encontró el archivo .env en: {ENV_PATH}")

app = FastAPI(title="Microservicio de Reportes e Integración", version="1.0.0")

# Habilitar CORS para conectar con el frontend Next.js y Django
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En desarrollo permitir todos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# MODELOS DE TRANSFERENCIA DE DATOS (DTOs)
# ==========================================
class ProductoDTO(BaseModel):
    codigo: str
    nombre: str
    caracteristicas: str
    precios: Dict[str, float]
    empresa_nombre: str

class EmailSendDTO(BaseModel):
    email: str
    productos: List[ProductoDTO]

class AISuggestDTO(BaseModel):
    nombre: str
    caracteristicas: str

class TransactionDTO(BaseModel):
    action: str
    details: str

class Block(BaseModel):
    index: int
    timestamp: float
    action: str
    details: str
    previous_hash: str
    hash: str


# ==========================================
# REPORTLAB PDF GENERATION HELPER
# ==========================================
def build_pdf_buffer(productos: List[ProductoDTO]) -> io.BytesIO:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter, 
        rightMargin=36, 
        leftMargin=36, 
        topMargin=36, 
        bottomMargin=36
    )
    story = []
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#6366f1'), # Indigo
        spaceAfter=10
    )
    
    subtitle_style = ParagraphStyle(
        'SubTitleStyle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748b'), # Slate grey
        spaceAfter=20
    )
    
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontSize=10,
        leading=12,
        textColor=colors.white,
        fontName='Helvetica-Bold'
    )
    
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#334155')
    )

    story.append(Paragraph("Reporte General de Inventario", title_style))
    story.append(Paragraph(f"Fecha de generación: {time.strftime('%Y-%m-%d %H:%M:%S')} | Generado por: Sistema de Microservicios", subtitle_style))
    story.append(Spacer(1, 10))
    
    # Encabezados de la tabla
    data = [[
        Paragraph("Empresa", table_header_style), 
        Paragraph("Código", table_header_style), 
        Paragraph("Producto", table_header_style), 
        Paragraph("Características", table_header_style), 
        Paragraph("Precios", table_header_style)
    ]]
    
    # Filas
    for p in productos:
        precios_str = ", ".join([f"{moneda}: {val}" for moneda, val in p.precios.items()])
        data.append([
            Paragraph(p.empresa_nombre, table_cell_style),
            Paragraph(p.codigo, table_cell_style),
            Paragraph(p.nombre, table_cell_style),
            Paragraph(p.caracteristicas, table_cell_style),
            Paragraph(precios_str, table_cell_style)
        ])
    
    # Anchura de columnas
    table = Table(data, colWidths=[100, 70, 110, 140, 120])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6366f1')), # Cabecera Indigo
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')), # Fondo gris claro
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
    ]))
    
    story.append(table)
    doc.build(story)
    buffer.seek(0)
    return buffer


# ==========================================
# BLOCKCHAIN AUDIT LEDGER LOGIC
# ==========================================
blockchain: List[Block] = []

def calculate_hash(index: int, timestamp: float, action: str, details: str, previous_hash: str) -> str:
    value = f"{index}{timestamp}{action}{details}{previous_hash}"
    return hashlib.sha256(value.encode('utf-8')).hexdigest()

def init_blockchain():
    if not blockchain:
        genesis_timestamp = time.time()
        genesis_hash = calculate_hash(0, genesis_timestamp, "GENESIS", "Creación de la cadena de auditoría criptográfica", "0")
        blockchain.append(Block(
            index=0,
            timestamp=genesis_timestamp,
            action="GENESIS",
            details="Creación de la cadena de auditoría criptográfica",
            previous_hash="0",
            hash=genesis_hash
        ))

# Inicializar al importar
init_blockchain()


# ==========================================
# ENDPOINTS API
# ==========================================

@app.get("/")
def read_root():
    return {"name": "FastAPI Microservice", "status": "Running"}


#Generar Reporte PDF
@app.post("/api/micro/pdf/generate")
def generate_pdf(productos: List[ProductoDTO]):
    try:
        buffer = build_pdf_buffer(productos)
        return StreamingResponse(
            buffer, 
            media_type="application/pdf", 
            headers={"Content-Disposition": "attachment; filename=reporte_inventario.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando PDF: {str(e)}")

# Enviar Reporte PDF por correo real vía Resend API
@app.post("/api/micro/email/send-pdf")
def send_pdf(dto: EmailSendDTO):
    try:
        # 1. Generar el PDF a partir de los datos
        buffer = build_pdf_buffer(dto.productos)
        pdf_bytes = buffer.getvalue()
        
        # 2. Leer la API Key de Resend desde Render
        resend_api_key = os.getenv("RESEND_API_KEY")
        
        if resend_api_key:
            # Convertir los bytes del PDF a cadena Base64
            pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
            
            # Endpoint oficial de Resend API
            url = "https://api.resend.com/emails"
            
            headers = {
                "Authorization": f"Bearer {resend_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "from": "DataSoft Inventory <onboarding@resend.dev>",  # Dominio de pruebas oficial de Resend
                "to": [dto.email],                                     # ¡Recibe cualquier correo real de destino!
                "subject": "Reporte de Inventario - DataSoft Inventory",
                "html": """
                    <h3>Hola,</h3>
                    <p>Adjunto encontrarás el reporte en formato PDF con la información consolidada de los productos por empresa.</p>
                    <br>
                    <p>Atentamente,<br><strong>DataSoft Inventory</strong></p>
                """,
                "attachments": [
                    {
                        "filename": "reporte_inventario.pdf",
                        "content": pdf_base64
                    }
                ]
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=15)
            
            if response.status_code in [200, 201]:
                return {
                    "status": "success",
                    "message": f"Reporte enviado exitosamente a {dto.email} vía Resend."
                }
            else:
                print(f"[RESEND ERROR] Status: {response.status_code} - Detail: {response.text}")
                raise HTTPException(status_code=500, detail=f"Error en la API de Resend: {response.text}")

        else:
            raise HTTPException(status_code=500, detail="Falta configurar la variable RESEND_API_KEY en el entorno.")

    except Exception as e:
        print(f"[MAIL CRITICAL ERROR] Detalle del fallo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error enviando correo: {str(e)}")

# Funcionalidad de Asistente de IA (Gemini)
@app.post("/api/micro/ai/suggest")
def ai_suggest_description(dto: AISuggestDTO):
    gemini_key = os.getenv("GEMINI_API_KEY")
    
    if not gemini_key:
        raise HTTPException(
            status_code=500, 
            detail="Error de Configuración: La variable GEMINI_API_KEY no está definida en el archivo .env o no se leyó correctamente."
        )

    # 1. Usamos v1beta con la estructura oficial recomendada por Google
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent"
    
    # Pasamos la API key como un parámetro Query limpio
    params = {"key": gemini_key}
    headers = {"Content-Type": "application/json"}
    
    prompt = (
        f"Actúa como un experto en redacción de catálogos y marketing. "
        f"Optimiza la descripción del siguiente producto para el inventario de la empresa, "
        f"haciéndola más atractiva, descriptiva y profesional. "
        f"Nombre del Producto: '{dto.nombre}'. Características actuales: '{dto.caracteristicas}'. "
        f"Devuelve únicamente la descripción optimizada resultante, sin notas, saludos ni comentarios."
    )
    
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }
    
    try:
        # 2. Agregamos el argumento 'params=params' para que requests construya la URL de forma segura
        res = requests.post(url, json=payload, headers=headers, params=params, timeout=12)
        
        if res.status_code == 200:
            data = res.json()
            if 'candidates' in data and len(data['candidates']) > 0:
                suggested_text = data['candidates'][0]['content']['parts'][0]['text']
                return {"suggested": suggested_text.strip()}
            else:
                raise HTTPException(status_code=502, detail="Google AI respondió con una estructura inesperada.")
        else:
            print(f"[GEMINI ERROR DETECTED] Status: {res.status_code} - Body: {res.text}")
            raise HTTPException(
                status_code=res.status_code, 
                detail=f"Google API devolvió un error: {res.text}"
            )
            
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Fallo de conexión con el servicio de Inteligencia Artificial: {str(e)}")


# Libro Criptográfico de Auditoría (Blockchain)
@app.post("/api/micro/blockchain/add")
def add_transaction_block(dto: TransactionDTO):
    try:
        previous_block = blockchain[-1]
        new_index = previous_block.index + 1
        current_timestamp = time.time()
        new_hash = calculate_hash(
            new_index,
            current_timestamp,
            dto.action,
            dto.details,
            previous_block.hash
        )
        new_block = Block(
            index=new_index,
            timestamp=current_timestamp,
            action=dto.action,
            details=dto.details,
            previous_hash=previous_block.hash,
            hash=new_hash
        )
        blockchain.append(new_block)
        return new_block
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/micro/blockchain/ledger")
def get_blockchain_ledger():
    # Validar integridad en tiempo real
    is_valid = True
    for i in range(1, len(blockchain)):
        current = blockchain[i]
        previous = blockchain[i-1]
        
        # Calcular hash esperado
        recalculated_hash = calculate_hash(
            current.index,
            current.timestamp,
            current.action,
            current.details,
            current.previous_hash
        )
        if current.hash != recalculated_hash:
            is_valid = False
            break
        if current.previous_hash != previous.hash:
            is_valid = False
            break
            
    return {
        "chain": blockchain,
        "is_valid": is_valid,
        "length": len(blockchain)
    }
