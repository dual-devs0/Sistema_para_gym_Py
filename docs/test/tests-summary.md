# Tests del Sistema

## Resumen de tests por módulo

### Módulo 1 — Auth & Usuarios (293a1f7)
| Archivo | Tipo |
|---------|------|
| `tests/test_api/test_auth.py` | API — autenticación (login, register, refresh) |
| `tests/test_api/test_users.py` | API — CRUD de usuarios |
| `tests/test_services/test_auth_service.py` | Servicio — lógica de autenticación |
| `tests/test_services/test_user_service.py` | Servicio — lógica de usuarios |
| `tests/test_security.py` | Seguridad — JWT, hashing |

### Módulo 6 — Dashboard (62dd6d6)
| Archivo | Tipo |
|---------|------|
| `tests/test_api/test_dashboard.py` | API — dashboard y reportes |
| `tests/test_services/test_dashboard_service.py` | Servicio — lógica de dashboard |

### Fix Auditoría (518f531)
| Archivo | Cambio |
|---------|--------|
| `tests/test_api/test_auth.py` | Correcciones post-auditoría |
| `tests/test_api/test_members.py` | Correcciones post-auditoría |
| `tests/test_api/test_memberships.py` | Correcciones post-auditoría |
| `tests/test_security.py` | Correcciones post-auditoría |
| `tests/test_services/test_dashboard_service.py` | Correcciones post-auditoría |
| `tests/test_services/test_member_service.py` | Correcciones post-auditoría |

### Configuración general
| Archivo | Propósito |
|---------|-----------|
| `tests/conftest.py` | Fixtures y configuración de pytest |
| `tests/__init__.py` | Package init |
| `tests/test_api/__init__.py` | Package init API tests |
| `tests/test_services/__init__.py` | Package init service tests |