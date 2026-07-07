from rest_framework import serializers
from .models import EmpresaModel, ProductoModel, UsuarioModel

# ==========================================
# SERIALIZADOR DE EMPRESA
# ==========================================
class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmpresaModel
        fields = ['nit', 'nombre', 'direccion', 'telefono']


# ==========================================
# SERIALIZADOR DE PRODUCTO
# ==========================================
class ProductoSerializer(serializers.ModelSerializer):
    # Mostramos los datos de la empresa legible en las consultas de lectura
    empresa_detalle = EmpresaSerializer(source='empresa', read_only=True)
    
    class Meta:
        model = ProductoModel
        fields = ['id', 'codigo', 'nombre', 'caracteristicas', 'precios', 'empresa', 'empresa_detalle']
        # 'empresa' recibe el NIT (ID de la empresa) al crear/actualizar
        # 'empresa_detalle' devuelve el objeto completo al hacer un GET


# ==========================================
# SERIALIZADOR DE REGISTRO DE USUARIOS
# ==========================================
class UsuarioRegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = UsuarioModel
        fields = ['correo', 'password', 'rol']

    def create(self, validated_data):
        # Usamos el manager personalizado que creamos en models.py para encriptar la contraseña correctamente
        user = UsuarioModel.objects.create_user(
            correo=validated_data['correo'],
            password=validated_data['password'],
            rol=validated_data.get('rol', 'Externo')
        )
        return user