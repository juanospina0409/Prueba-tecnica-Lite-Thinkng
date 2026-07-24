from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmpresaViewSet, ProductoViewSet, registrar_usuario, login_usuario, obtener_perfil, health_check

# El Router de DRF genera automáticamente las rutas estándar de tipo /empresas/, /empresas/id/
router = DefaultRouter()
router.register(r'empresas', EmpresaViewSet, basename='empresa')
router.register(r'productos', ProductoViewSet, basename='producto')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/registrar/', registrar_usuario, name='registrar_usuario'),
    path('auth/login/', login_usuario, name='login_usuario'),
    path('auth/me/', obtener_perfil, name='obtener_perfil'),
    path('api/health/', health_check, name='health_check'),
]