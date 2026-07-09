import requests
import json
import sys

# para uso local
# BACKEND_URL = "http://localhost:8000"
# FASTAPI_URL = "http://localhost:8001"

# para uso en render.com:
BACKEND_URL = "https://backend-django-3dq5.onrender.com"
FASTAPI_URL = "https://microservice-fastapi.onrender.com"

def test_flow():
    print("=== INICIANDO VALIDACION AUTOMATICA DE APIs ===")
    
    # 1. Probar Login de Administrador
    print("\n1. Probando Login de Administrador...")
    admin_payload = {
        "correo": "admin@litetest.com",
        "password": "password123"
    }
    res = requests.post(f"{BACKEND_URL}/api/auth/login/", json=admin_payload)
    if res.status_code != 200:
        print(f"Error al iniciar sesion como admin: {res.status_code} - {res.text}")
        sys.exit(1)
    admin_data = res.json()
    admin_token = admin_data['token']
    print(f"Login exitoso. Token: {admin_token[:10]}... Rol: {admin_data['rol']}")
    
    # 2. Probar Perfil (/me) con Token
    print("\n2. Probando endpoint de perfil /me...")
    headers = {"Authorization": f"Token {admin_token}"}
    res_me = requests.get(f"{BACKEND_URL}/api/auth/me/", headers=headers)
    if res_me.status_code != 200:
        print(f"Error al obtener perfil: {res_me.text}")
        sys.exit(1)
    print(f"Perfil obtenido: {res_me.json()}")

    # 3. Probar Login de Externo
    print("\n3. Probando Login de Usuario Externo...")
    extern_payload = {
        "correo": "externo@litetest.com",
        "password": "password123"
    }
    res_ext = requests.post(f"{BACKEND_URL}/api/auth/login/", json=extern_payload)
    if res_ext.status_code != 200:
        print(f"Error al iniciar sesion como externo: {res_ext.text}")
        sys.exit(1)
    extern_data = res_ext.json()
    extern_token = extern_data['token']
    print(f"Login de Externo exitoso. Rol: {extern_data['rol']}")

    # 4. Probar Restricción de Permisos (Externo no puede crear Empresa)
    print("\n4. Probando restriccion de permisos (Externo intentando crear Empresa)...")
    ext_headers = {"Authorization": f"Token {extern_token}"}
    test_empresa = {
        "nit": "999-TEST",
        "nombre": "Empresa Prohibida",
        "direccion": "Calle Falsa 123",
        "telefono": "555-5555"
    }
    res_block = requests.post(f"{BACKEND_URL}/api/empresas/", json=test_empresa, headers=ext_headers)
    if res_block.status_code in [401, 403]:
        print(f"Correcto. Peticion bloqueada con codigo de estado esperado: {res_block.status_code}")
    else:
        print(f"Error: El usuario Externo pudo crear/modificar recursos. Estado: {res_block.status_code}")
        sys.exit(1)

    # 5. Probar Creación por Administrador (Empresa y Producto)
    print("\n5. Creando Empresa como Administrador...")
    empresa_payload = {
        "nit": "900-111-222",
        "nombre": "Test Technology S.A.S.",
        "direccion": "Diagonal 15 # 45",
        "telefono": "777-8888"
    }
    res_emp = requests.post(f"{BACKEND_URL}/api/empresas/", json=empresa_payload, headers=headers)
    if res_emp.status_code not in [200, 201]:
        print(f"Error al crear empresa como admin: {res_emp.status_code} - {res_emp.text}")
        sys.exit(1)
    print(f"Empresa creada con exito: {res_emp.json()}")
    
    # Registrar en Blockchain desde el script (simulando comportamiento de la app)
    requests.post(f"{FASTAPI_URL}/api/micro/blockchain/add", json={
        "action": "CREAR_EMPRESA",
        "details": f"Empresa registrada: NIT={empresa_payload['nit']}, Nombre={empresa_payload['nombre']}"
    })

    print("Creando Producto como Administrador...")
    producto_payload = {
        "codigo": "P-TEST-001",
        "nombre": "Celular Inteligente Lite",
        "caracteristicas": "8GB RAM, Pantalla OLED 6.5 pulgadas",
        "empresa": "900-111-222",
        "precios": {
            "USD": 350.0,
            "COP": 1400000.0
        }
    }
    res_prod = requests.post(f"{BACKEND_URL}/api/productos/", json=producto_payload, headers=headers)
    if res_prod.status_code not in [200, 201]:
        print(f"Error al crear producto como admin: {res_prod.status_code} - {res_prod.text}")
        sys.exit(1)
    print(f"Producto creado con exito: {res_prod.json()}")
    
    # Registrar en Blockchain
    requests.post(f"{FASTAPI_URL}/api/micro/blockchain/add", json={
        "action": "CREAR_PRODUCTO",
        "details": f"Producto registrado: Codigo={producto_payload['codigo']}, Nombre={producto_payload['nombre']}"
    })

    # 6. Probar Microservicio FastAPI: Generar PDF
    print("\n6. Probando generacion de PDF en FastAPI...")
    pdf_payload = [{
        "codigo": "P-TEST-001",
        "nombre": "Celular Inteligente Lite",
        "caracteristicas": "8GB RAM, Pantalla OLED",
        "precios": {"USD": 350.0, "COP": 1400000.0},
        "empresa_nombre": "Test Technology S.A.S."
    }]
    res_pdf = requests.post(f"{FASTAPI_URL}/api/micro/pdf/generate", json=pdf_payload)
    if res_pdf.status_code != 200:
        print(f"Error al generar PDF: {res_pdf.status_code}")
        sys.exit(1)
    print(f"PDF generado exitosamente ({len(res_pdf.content)} bytes)")

    # 7. Probar Microservicio FastAPI: Envío de correo (simulado)
    print("\n7. Probando envio de correo simulado en FastAPI...")
    email_payload = {
        "email": "test-user@litetest.com",
        "productos": pdf_payload
    }
    res_email = requests.post(f"{FASTAPI_URL}/api/micro/email/send-pdf", json=email_payload)
    if res_email.status_code != 200:
        print(f"Error al enviar correo: {res_email.status_code}")
        sys.exit(1)
    print(f"Respuesta de envio de correo: {res_email.json()}")

    # 8. Probar Microservicio FastAPI: Sugerencia de IA
    print("\n8. Probando Asistente de IA (Gemini / Simulado)...")
    ai_payload = {
        "nombre": "Computador Portatil Core I9",
        "caracteristicas": "32GB RAM, SSD 1TB, tarjeta de video dedicada"
    }
    res_ai = requests.post(f"{FASTAPI_URL}/api/micro/ai/suggest", json=ai_payload)
    if res_ai.status_code != 200:
        print(f"Error al obtener sugerencia de IA: {res_ai.status_code}")
        sys.exit(1)
    print(f"Respuesta de IA obtenida: {res_ai.json()}")

    # 9. Probar Integridad del Ledger Criptográfico (Blockchain)
    print("\n9. Probando Ledger Criptografico (Blockchain)...")
    res_bc = requests.get(f"{FASTAPI_URL}/api/micro/blockchain/ledger")
    if res_bc.status_code != 200:
        print(f"Error al obtener el Ledger: {res_bc.status_code}")
        sys.exit(1)
    bc_data = res_bc.json()
    print(f"Cadena de Auditoria obtenida. Largo: {bc_data['length']}. Valida?: {bc_data['is_valid']}")
    if not bc_data['is_valid']:
        print("Error: La cadena criptografica de auditoria no es valida!")
        sys.exit(1)
    print("Muestra de bloques:")
    for block in bc_data['chain']:
        print(f"  - Bloque #{block['index']}: {block['action']} | Hash: {block['hash'][:10]}...")

    print("\n=== TODAS LAS APIS Y FUNCIONALIDADES DE INTEGRACION OPERAN CORRECTAMENTE ===")

if __name__ == "__main__":
    test_flow()
