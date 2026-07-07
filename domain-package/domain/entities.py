from pydantic import BaseModel, Field, EmailStr
from typing import Dict, Optional

class Empresa(BaseModel):
    nit: str = Field(..., description="Llave primaria única de la empresa")
    nombre: str = Field(..., min_length=2)
    direccion: str
    telefono: str

    class Config:
        # Esto permite que Pydantic interactúe fácilmente con objetos ORM
        from_attributes = True


class Producto(BaseModel):
    codigo: str = Field(..., description="Código único del producto")
    nombre: str
    caracteristicas: str
    # Precio en varias monedas
    # Un diccionario ej: {"USD": 100.0, "COP": 390000.0}
    precios: Dict[str, float] = Field(..., description="Diccionario de precios por moneda")
    empresa_nit: str

    class Config:
        from_attributes = True


class Usuario(BaseModel):
    correo: EmailStr # Valida automáticamente que sea un correo real
    contrasena_encriptada: str
    rol: str = Field(..., description="Debe ser 'Administrador' o 'Externo'")

    class Config:
        from_attributes = True