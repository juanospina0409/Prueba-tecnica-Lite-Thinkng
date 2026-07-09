# Usa una imagen oficial y liviana de Python 3.11
FROM python:3.11-slim

# Evita que Python escriba archivos .pyc en disco y fuerza la salida en consola sin buffer
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# 1. Copiar e instalar el paquete de Dominio local
COPY domain-package /app/domain-package
RUN pip install --no-cache-dir -e /app/domain-package

# 2. Copiar requerimientos del Backend e instalarlos
COPY backend-django/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn  # Servidor WSGI de producción

# 3. Copiar todo el código fuente de Django
COPY backend-django /app/

# Exponer el puerto de Django
EXPOSE 8000

# Comando para ejecutar migraciones y levantar el servidor con Gunicorn en producción
CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:8000"]