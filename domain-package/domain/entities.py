from pydantic import BaseModel, Field, EmailStr
from typing import Dict, Optional

class Empresa(BaseModel):
    """
    Entidad pura del negocio para una Empresa (Punto a del requerimiento)
    """
    nit: str = Field(..., description="Llave primaria única de la empresa")
    nombre: str = Field(..., min_length=2)
    direccion: str
    telefono: str

    class Config:
        # Esto permite que Pydantic interactúe fácilmente con objetos ORM más adelante
        from_attributes = True


class Producto(BaseModel):
    """
    Entidad pura del negocio para un Producto (Punto b del requerimiento)
    """
    codigo: str = Field(..., description="Código único del producto")
    nombre: str
    caracteristicas: str
    # El requerimiento pide "Precio en varias monedas". 
    # Un diccionario ej: {"USD": 100.0, "COP": 390000.0} es ideal y flexible.
    precios: Dict[str, float] = Field(..., description="Diccionario de precios por moneda")
    # Asociamos el NIT de la empresa, manteniendo el desacoplamiento
    empresa_nit: str

    class Config:
        from_attributes = True


class Usuario(BaseModel):
    """
    Entidad pura para el manejo de credenciales y roles (Puntos c, e y f)
    """
    correo: EmailStr # Valida automáticamente que sea un correo real
    contrasena_encriptada: str
    rol: str = Field(..., description="Debe ser 'Administrador' o 'Externo'")

    class Config:
        from_attributes = True