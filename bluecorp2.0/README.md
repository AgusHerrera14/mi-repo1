# Blue Corp 2.0 — Sistema de Gestión Previsional

Sistema integral para la gestión del régimen de jubilaciones y pensiones conforme a la Ley 24.241 (SIPA).

## Inicio rápido (local)

```bash
cd bluecorp2.0
chmod +x start.sh
./start.sh
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Documentación API: http://localhost:8000/docs

## Credenciales de prueba

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | Admin |
| operador1 | op123456 | Operador |
| supervisor1 | sup123456 | Supervisor |

## Inicio con Docker

```bash
cd bluecorp2.0
docker-compose up --build
```

## Módulos del sistema

| Módulo | Descripción |
|--------|-------------|
| Dashboard | Estadísticas globales, alertas, distribución por tipo/provincia |
| Afiliados | Alta, baja, modificación del padrón de beneficiarios |
| Liquidaciones | Cálculo mensual, SAC, retroactivos, recibo PDF |
| Expedientes | Trámites administrativos con historial de movimientos |
| Novedades | Eventos que impactan haberes (suspensiones, reajustes, etc.) |
| Movilidad | Tabla histórica de coeficientes + simulador |
| RIPTE | Tabla RIPTE mensual (MTEySS) |
| Reportes | Exportación Excel/CSV de afiliados y liquidaciones |

## Motor de Cálculo Previsional (SIPA — Ley 24.241)

### Jubilación Ordinaria
- **PBU** (Art. 19-21): `2.5 × haber_mínimo_garantizado`
- **PC** (Art. 23-25): `1.5% × años_pre_SIJP × PBCI` (servicios anteriores julio 1994)
- **PAP** (Art. 30-31): `0.85% × años_post_SIJP × PBCI`
- **Haber Bruto**: `PBU + PC + PAP + complemento_zona`

### Movilidad (actualización)
| Período | Ley | Frecuencia |
|---------|-----|------------|
| 2009–2016 | Ley 26.417 | Trimestral (por RIPTE/IPC) |
| 2017–2019 | Ley 27.426 | Trimestral (IPC 70% + RIPTE 30%) |
| 2020 | DNU 163/2020 | Suspensión movilidad |
| 2021–2023 | Ley 27.609 | Trimestral (IPC 50% + RIPTE 50%) |
| 2024– | DL 274/2024 | Mensual por IPC |

### SAC (Ley 23.041)
- `importe = 50% × mejor_haber_semestre × (meses_activos / 6)`
- Liquidado en junio y diciembre

### Descuentos
- **PAMI** (Ley 19.032): 3% sobre haber bruto — obligatorio
- **Embargos**: máximo 20% del haber neto (Art. 120 Ley 24.241)
- **Voluntarios** (sindicato, mutual, préstamo): por orden de prioridad
- **Piso**: haber neto ≥ 70% del haber con movilidad (Art. 120 L.24241)

### Retroactivos
- Cálculo período a período aplicando coeficientes históricos de movilidad
- Base legal: Ley 26.153, CSJN "Badaro" y "Elliff"

## Estructura del proyecto

```
bluecorp2.0/
├── backend/
│   ├── app/
│   │   ├── engines/          # Motores de cálculo
│   │   │   ├── pension_engine.py     # PBU, PC, PAP
│   │   │   ├── movilidad_engine.py   # Coeficientes históricos
│   │   │   ├── sac_engine.py         # SAC semestral
│   │   │   ├── retroactivo_engine.py # Retroactivos con movilidad
│   │   │   ├── descuento_engine.py   # PAMI + voluntarios
│   │   │   └── ripte_data.py         # Datos RIPTE históricos
│   │   ├── models/           # Modelos SQLAlchemy
│   │   ├── schemas/          # Esquemas Pydantic
│   │   ├── api/endpoints/    # Endpoints FastAPI
│   │   └── utils/
│   │       └── recibo_pdf.py # Generación recibo PDF
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/            # Todas las vistas
        ├── components/       # Layout, StatCard
        ├── services/api.ts   # Cliente HTTP
        ├── context/          # AuthContext
        └── types/index.ts    # Tipos TypeScript
```

## Requisitos

- **Backend**: Python 3.9+
- **Frontend**: Node.js 16+ / npm 8+
- **Docker**: Docker + Docker Compose (opcional)
