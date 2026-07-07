from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

# ==========================================
# 1. MODELO DE EMPRESA (Requerimiento a)
# ==========================================
class EmpresaModel(models.Model):
    # Definimos el NIT explícitamente como llave primaria (primary_key=True)
    nit = models.CharField(max_length=50, primary_key=True)
    nombre = models.CharField(max_length=255)
    direccion = models.CharField(max_length=255)
    telefono = models.CharField(max_length=50)

    class Meta:
        db_table = 'empresas'

    def __str__(self):
        return self.nombre


# ==========================================
# 2. MODELO DE PRODUCTO Y INVENTARIO (Requerimiento b y e)
# ==========================================
class ProductoModel(models.Model):
    codigo = models.CharField(max_length=100, unique=True)
    nombre = models.CharField(max_length=255)
    caracteristicas = models.TextField()
    
    # "Precio en varias monedas": Guardamos un JSON estructurado ej: {"USD": 50, "COP": 200000}
    precios = models.JSONField(default=dict)
    
    # Relación con la Empresa (Punto b y e)
    # Al eliminar una empresa, se eliminan sus productos en cascada (opcional, pero buena práctica)
    empresa = models.ForeignKey(EmpresaModel, on_delete=models.CASCADE, related_name='productos')

    class Meta:
        db_table = 'productos'

    def __str__(self):
        return f"{self.nombre} ({self.empresa.nombre})"


# ==========================================
# 3. GESTIÓN DE USUARIOS PERSONALIZADOS (Requerimiento c, e y f)
# ==========================================
class UsuarioManager(BaseUserManager):
    def create_user(self, correo, password=None, rol='Externo'):
        if not correo:
            raise ValueError('El usuario debe tener un correo electrónico')
        
        user = self.model(
            correo=self.normalize_email(correo),
            rol=rol,
        )
        user.set_password(password) # Encripta automáticamente la contraseña (Requerimiento f)
        user.save(using=self._db)
        return user

    def create_superuser(self, correo, password=None):
        user = self.create_user(correo, password=password, rol='Administrador')
        user.is_admin = True
        user.save(using=self._db)
        return user


class UsuarioModel(AbstractBaseUser):
    correo = models.EmailField(max_length=255, unique=True)
    
    # Definimos los roles permitidos explícitamente (Requerimiento e)
    ROLES_CHOICES = [
        ('Administrador', 'Administrador'),
        ('Externo', 'Externo'),
    ]
    rol = models.CharField(max_length=20, choices=ROLES_CHOICES, default='Externo')
    
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)

    objects = UsuarioManager()

    USERNAME_FIELD = 'correo'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'usuarios'

    def __str__(self):
        return f"{self.correo} - {self.rol}"

    # Permisos necesarios para el panel de administración de Django (si decides usarlo)
    def has_perm(self, perm, obj=None): return True
    def has_module_perms(self, app_label): return True

    @property
    def is_staff(self):
        return self.is_admin