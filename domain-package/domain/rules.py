from pydantic import field_validator
# Puedes agregar esto dentro de la clase Usuario para asegurar las reglas del negocio:

@field_validator('rol')
def validar_rol(cls, v):
    if v not in ['Administrador', 'Externo']:
        raise ValueError("El rol debe ser 'Administrador' o 'Externo'")
    return v