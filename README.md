# 🏗️ DataSoft Inventory — Prueba Técnica DataSoft Inventory 2026

> **Aplicación fullstack** de gestión de inventarios empresariales construida con **Django + FastAPI + Next.js + PostgreSQL**, siguiendo principios de Arquitectura Limpia y microservicios.

---

## 📑 Tabla de Contenidos

- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Stack Tecnológico](#-stack-tecnológico)
- [Prerrequisitos](#-prerrequisitos)
- [Instalación Rápida](#-instalación-rápida)
- [Variables de Entorno](#-variables-de-entorno)
- [Ejecución de Servidores de Desarrollo](#-ejecución-de-servidores-de-desarrollo)
- [Endpoints de la API](#-endpoints-de-la-api)
- [Funcionalidades Principales](#-funcionalidades-principales)

---

## 🏛️ Arquitectura del Sistema

El proyecto sigue una **arquitectura de microservicios** con una capa de dominio desacoplada, inspirada en los principios de **Clean Architecture**:

```
PruebaTecnicaLiteThinking/
│
├── domain-package/          ← 🧠 Capa de Dominio (paquete Python/Poetry)
│   ├── domain/
│   │   ├── entities.py      # Entidades puras: Empresa, Producto, Usuario
│   │   └── rules.py         # Reglas de negocio (validaciones de rol)
│   └── pyproject.toml       # Configuración Poetry del paquete
│
├── backend-django/          ← ⚙️ Backend principal (API REST + Auth)
│   ├── core/                # Configuración central de Django (settings, urls)
│   ├── inventario/          # App Django: models, views, serializers, urls
│   │   └── migrations/      # Migraciones de la base de datos
│   └── manage.py            # CLI de administración de Django
│
├── microservice-fastapi/    ← 🚀 Microservicio auxiliar (FastAPI)
│   ├── main.py              # Reportes PDF, email, IA (Gemini), Blockchain
│   └── requirements.txt     # Dependencias del microservicio
│
├── frontend-nextjs/         ← 🎨 Frontend (Next.js + React)
│   └── src/
│       ├── pages/           # Vistas: login, empresas, productos, inventario, copiloto
│       ├── components/      # Componentes reutilizables: Layout, Navbar
│       └── styles/          # Hojas de estilo CSS
│
├── docker-compose.yml       ← 🐳 Orquestación de la base de datos PostgreSQL + pgvector
├── .env                     ← 🔐 Variables de entorno (NO se sube a Git)
└── .env.example             ← 📋 Plantilla de variables de entorno
```

### Resumen por carpeta

| Carpeta | Responsabilidad |
|---|---|
| **`domain-package/`** | Paquete Python gestionado con **Poetry**. Contiene las entidades puras del negocio (`Empresa`, `Producto`, `Usuario`) y sus reglas de validación, usando **Pydantic**. Está **completamente desacoplada** de Django, HTTP, vistas o infraestructura. |
| **`backend-django/`** | API REST desarrollada con **Django 6 + Django REST Framework**. Gestiona autenticación con tokens, CRUD de empresas y productos, y persistencia en **PostgreSQL**. Consume `domain-package` a través del `sys.path`. |
| **`microservice-fastapi/`** | Microservicio independiente con **FastAPI**. Proporciona: generación de **reportes PDF** (ReportLab), envío de **emails con adjuntos** (SMTP/Mailtrap), sugerencias con **IA Generativa** (Gemini API), y un **libro de auditoría criptográfico** (Blockchain simplificada con SHA-256). |
| **`frontend-nextjs/`** | Interfaz de usuario con **Next.js 14 + React 18**. Incluye páginas para login, gestión de empresas, productos, vista de inventario con descarga/envío de PDF, y un copiloto de IA. Usa **Lucide React** para iconografía. |

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14, React 18, Lucide React |
| Backend API | Django 6, Django REST Framework, Token Auth |
| Microservicio | FastAPI, Uvicorn, ReportLab, Gemini AI |
| Dominio | Python, Pydantic v2, Poetry |
| Base de Datos | PostgreSQL 16 + pgvector (Docker) |
| Infraestructura | Docker Compose |
| Email | SMTP (Mailtrap para testing) |
| IA Generativa | Google Gemini 2.5 Flash |
| Auditoría | Blockchain simplificada (SHA-256) |

---

## 📋 Prerrequisitos

Asegúrate de tener instalado:

- **Python 3.13+** → [python.org](https://www.python.org/downloads/)
- **Node.js 18+** y **npm** → [nodejs.org](https://nodejs.org/)
- **Docker Desktop** → [docker.com](https://www.docker.com/products/docker-desktop/)
- **Poetry** (para el paquete de dominio) → [python-poetry.org](https://python-poetry.org/docs/#installation)
- **Git** → [git-scm.com](https://git-scm.com/)

---

## 🚀 Instalación Rápida

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd PruebaTecnicaLiteThinking
```

### 2. Configurar variables de entorno

Copia la plantilla y edita los valores si lo necesitas (los valores por defecto de prueba ya funcionan):

```bash
cp .env.example .env
```

> 📌 La plantilla `.env.example` ya viene con credenciales de prueba de Mailtrap y datos de la base de datos local.

### 3. Levantar la base de datos con Docker

```bash
docker-compose up -d
```

Esto levanta un contenedor **PostgreSQL con pgvector** llamado `lite_postgres` en el puerto `5432`.  
Para verificar que está corriendo:

```bash
docker ps
```

### 4. Configurar el paquete de dominio (Poetry)

```bash
cd domain-package
poetry install
cd ..
```

### 5. Configurar el backend Django

```bash
cd backend-django

# Crear y activar el entorno virtual
python -m venv .venv

# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1
# Windows (CMD)
.\.venv\Scripts\activate.bat
# Linux / macOS
source .venv/bin/activate

# Instalar dependencias
pip install django djangorestframework django-cors-headers django-environ psycopg2-binary pydantic[email]

# Aplicar migraciones (la app "inventario" usa un modelo de usuario personalizado)
python manage.py makemigrations inventario
python manage.py migrate

# (Opcional) Crear un superusuario administrador
python manage.py createsuperuser

cd ..
```

> ⚠️ **Nota importante sobre migraciones:** Al tener un `AUTH_USER_MODEL` personalizado (`inventario.UsuarioModel`), es necesario ejecutar primero `makemigrations inventario` para generar la migración inicial del modelo de usuario antes del `migrate` general.

### 6. Configurar el microservicio FastAPI

```bash
cd microservice-fastapi

# Crear y activar el entorno virtual
python -m venv .venv

# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1
# Linux / macOS
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

cd ..
```

### 7. Configurar el frontend Next.js

```bash
cd frontend-nextjs
npm install
cd ..
```

---

## 🔐 Variables de Entorno

El proyecto utiliza un único archivo `.env` en la **raíz del proyecto** que es leído por los tres servicios (Django, FastAPI, y Docker Compose).

Consulta el archivo [`.env.example`](.env.example) como plantilla:

| Variable | Descripción | Valor de ejemplo |
|---|---|---|
| `DB_USER` | Usuario de PostgreSQL | `lite_user` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `lite_password` |
| `DB_NAME` | Nombre de la base de datos | `lite_db` |
| `GEMINI_API_KEY` | API Key de Google Gemini (para IA) | `tu_api_key_aqui` |
| `SMTP_SERVER` | Servidor SMTP | `sandbox.smtp.mailtrap.io` |
| `SMTP_USER` | Usuario SMTP (Mailtrap) | `tu_usuario_mailtrap` |
| `SMTP_PASSWORD` | Contraseña SMTP (Mailtrap) | `tu_password_mailtrap` |
| `SMTP_PORT` | Puerto SMTP | `2525` |

---

## ▶️ Ejecución de Servidores de Desarrollo

Necesitas **4 terminales** abiertas simultáneamente:

### Terminal 1 — Base de datos (Docker)

```bash
docker-compose up -d
```

### Terminal 2 — Backend Django (puerto 8000)

```bash
cd backend-django
.\.venv\Scripts\Activate.ps1       # Activar entorno virtual
python manage.py runserver
```

> Disponible en: **http://127.0.0.1:8000**

### Terminal 3 — Frontend Next.js (puerto 3000)

```bash
cd frontend-nextjs
npm run dev
```

> Disponible en: **http://localhost:3000**

### Terminal 4 — Microservicio FastAPI (puerto 8001)

```bash
cd microservice-fastapi
.\.venv\Scripts\Activate.ps1       # Activar entorno virtual
uvicorn main:app --port 8001
```

> Disponible en: **http://127.0.0.1:8001**  
> Documentación interactiva (Swagger): **http://127.0.0.1:8001/docs**

---

## 📡 Endpoints de la API

### Backend Django (`http://127.0.0.1:8000/api/`)

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/auth/registrar/` | Registrar un nuevo usuario |
| `POST` | `/api/auth/login/` | Iniciar sesión (devuelve token) |
| `GET` | `/api/auth/me/` | Obtener perfil del usuario autenticado |
| `GET/POST` | `/api/empresas/` | Listar / Crear empresas |
| `GET/PUT/DELETE` | `/api/empresas/{nit}/` | Detalle / Editar / Eliminar empresa |
| `GET/POST` | `/api/productos/` | Listar / Crear productos |
| `GET/PUT/DELETE` | `/api/productos/{id}/` | Detalle / Editar / Eliminar producto |

### Microservicio FastAPI (`http://127.0.0.1:8001`)

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/` | Health check del microservicio |
| `POST` | `/api/micro/pdf/generate` | Generar reporte PDF del inventario |
| `POST` | `/api/micro/email/send-pdf` | Enviar reporte PDF por correo electrónico |
| `POST` | `/api/micro/ai/suggest` | Sugerencia de descripción con IA (Gemini) |
| `POST` | `/api/micro/blockchain/add` | Registrar transacción en cadena de auditoría |
| `GET` | `/api/micro/blockchain/ledger` | Consultar libro de auditoría completo |

---

## 🔍 Validación Automática

Se incluye un script de prueba `test_api.py` en la raíz del proyecto. Puedes ejecutarlo para validar el flujo completo:

```bash
cd microservice-fastapi
python test_api.py
```

El script valida:
1. Login de admin y usuario externo
2. Restricción de permisos (usuario externo no puede crear empresas)
3. Creación de empresa y producto como admin
4. Generación de PDF
5. Envío simulado de correo
6. Sugerencia de IA
7. Consulta del libro de auditoría

## ✨ Funcionalidades Principales

- **CRUD de Empresas y Productos** con control de acceso por roles.
- **Autenticación con tokens** y contraseñas encriptadas.
- **Roles de usuario**: `Administrador` (CRUD completo) y `Externo` (solo lectura).
- **Generación de reportes PDF** con ReportLab desde el microservicio.
- **Envío de reportes por email** vía SMTP (integración con Mailtrap para testing).
- **Copiloto de IA** que sugiere descripciones de productos usando Google Gemini.
- **Libro de auditoría criptográfico (Blockchain)** con integridad verificable en tiempo real.
- **Capa de dominio independiente** gestionada con Poetry, siguiendo Clean Architecture.
- **PostgreSQL con pgvector** preparado para búsquedas semánticas con embeddings.

---

## 📄 Licencia

Proyecto desarrollado como prueba técnica para **DataSoft Inventory — 2026**.
