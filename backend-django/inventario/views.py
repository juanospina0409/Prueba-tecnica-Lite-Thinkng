from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, BasePermission, SAFE_METHODS
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.http import JsonResponse
from pydantic import ValidationError as PydanticValidationError

from .models import EmpresaModel, ProductoModel, UsuarioModel
from .serializers import EmpresaSerializer, ProductoSerializer, UsuarioRegistroSerializer

# Se importan las entidades Pydantic del paquete de dominio
from domain.entities import Empresa

# ==========================================
# Endpoint de Health Check
# ==========================================
def health_check(request):
    return JsonResponse({"status": "healthy"}, status=200)

# ==========================================
# PERMISO PERSONALIZADO PARA ADMINISTRADORES
# ==========================================
class IsAdministradorOrReadOnly(BasePermission):
    """
    Permiso que permite ver (GET) a cualquier usuario,
    pero requiere ser Administrador para crear, editar o eliminar.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.rol == 'Administrador'


# ==========================================
# VIEWSET DE EMPRESA (Con Validación de Dominio y Permisos)
# ==========================================
class EmpresaViewSet(viewsets.ModelViewSet):
    queryset = EmpresaModel.objects.all()
    serializer_class = EmpresaSerializer
    permission_classes = [IsAdministradorOrReadOnly]

    def create(self, request, *args, **kwargs):
        try:
            # Pydantic validará tipos, formato de correo, etc. automáticamente
            Empresa(**request.data)
        except PydanticValidationError as e:
            return Response(
                {"error": "Validación de Dominio fallida", "detalles": e.errors()},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Si la capa de dominio le dio el visto bueno entonces Django lo guarda
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        try:
            Empresa(**request.data)
        except PydanticValidationError as e:
            return Response(
                {"error": "Validación de Dominio fallida", "detalles": e.errors()},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().update(request, *args, **kwargs)


# ==========================================
# 2. VIEWSET DE PRODUCTO
# ==========================================
class ProductoViewSet(viewsets.ModelViewSet):
    queryset = ProductoModel.objects.all()
    serializer_class = ProductoSerializer
    permission_classes = [IsAdministradorOrReadOnly]


# ==========================================
# 3. ENDPOINT DE REGISTRO DE USUARIOS
# ==========================================
@api_view(['POST'])
@permission_classes([AllowAny]) # Se permite que cualquiera pueda registrarse inicialmente
def registrar_usuario(request):
    serializer = UsuarioRegistroSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(
            {"mensaje": "Usuario registrado exitosamente"}, 
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# 4. ENDPOINT DE INICIO DE SESIÓN
# ==========================================
@api_view(['POST'])
@permission_classes([AllowAny])
def login_usuario(request):
    correo = request.data.get('correo')
    password = request.data.get('password')
    
    if not correo or not password:
        return Response(
            {"error": "Debe proporcionar correo y contraseña"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(username=correo, password=password)
    if not user:
        return Response(
            {"error": "Credenciales inválidas"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    token, created = Token.objects.get_or_create(user=user)
    return Response({
        "token": token.key,
        "correo": user.correo,
        "rol": user.rol
    }, status=status.HTTP_200_OK)


# ==========================================
# 5. ENDPOINT PARA OBTENER EL USUARIO ACTUAL
# ==========================================
@api_view(['GET'])
def obtener_perfil(request):
    if not request.user.is_authenticated:
        return Response(
            {"error": "No autenticado"}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    return Response({
        "correo": request.user.correo,
        "rol": request.user.rol
    }, status=status.HTTP_200_OK)