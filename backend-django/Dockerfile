# Cambiamos python:3.11-slim por python:3.12-slim
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copiar e instalar el paquete de Dominio local
COPY domain-package /app/domain-package
RUN pip install --no-cache-dir --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -e /app/domain-package

# Copiar e instalar requerimientos de Django
COPY backend-django/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn

COPY backend-django /app/

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate --noinput && python -c \"import os, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings'); django.setup(); from inventario.models import UsuarioModel; UsuarioModel.objects.filter(correo='admin@litetest.com').exists() or UsuarioModel.objects.create_superuser('admin@litetest.com', 'password123'); UsuarioModel.objects.filter(correo='externo@litetest.com').exists() or UsuarioModel.objects.create_user('externo@litetest.com', 'password123', rol='Externo')\" && gunicorn core.wsgi:application --bind 0.0.0.0:8000"]