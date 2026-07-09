FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copiar e instalar el paquete de Dominio local
COPY domain-package /app/domain-package
RUN pip install --no-cache-dir -e /app/domain-package

# Copiar requerimientos de FastAPI e instalarlos
COPY microservice-fastapi/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo el código fuente de FastAPI
COPY microservice-fastapi /app/

# Exponer el puerto de FastAPI
EXPOSE 8001

# Comando para levantar FastAPI con Uvicorn en producción
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]