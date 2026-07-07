from pydantic import field_validator

@field_validator('rol')
def validar_rol(cls, v):
    if v not in ['Administrador', 'Externo']:
        raise ValueError("El rol debe ser 'Administrador' o 'Externo'")
    return v