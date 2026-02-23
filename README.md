# Blue Corp — Sistema de Gestión Previsional

Sistema completo de gestión de jubilaciones y pensiones del **SIPA** (Sistema Integrado Previsional Argentino), basado en la **Ley 24.241** y sus modificatorias.

---

## Estructura del proyecto

```
mi-repo1/
├── backend/              # API Python/FastAPI
│   ├── app/
│   │   ├── api/          # Endpoints REST
│   │   ├── core/         # Config, DB, seguridad JWT
│   │   ├── engines/      # Motores de cálculo previsional
│   │   ├── models/       # Modelos SQLAlchemy
│   │   ├── schemas/      # Schemas Pydantic
│   │   └── services/     # Lógica de negocio
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/             # Interfaz React/TypeScript + MUI
│   ├── src/
│   │   ├── components/   # Componentes reutilizables
│   │   ├── context/      # AuthContext
│   │   ├── pages/        # Páginas de la app
│   │   ├── services/     # Cliente API
│   │   └── types/        # TypeScript types
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

---

## Cómo ejecutar (sin Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Documentación interactiva: **http://localhost:8000/docs**

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

App disponible en: **http://localhost:3000**

### Con Docker Compose

```bash
docker-compose up --build
```

---

## Credenciales por defecto

| Usuario    | Contraseña | Rol       |
|------------|------------|-----------|
| admin      | admin123   | Admin     |
| operador1  | op123456   | Operador  |

---

## Lógica legal implementada

### Las tres prestaciones (Ley 24.241)

#### 1. PBU — Prestación Básica Universal (Art. 19-21)
- Monto fijo que cobra todo jubilado.
- **Fórmula:** `PBU = 2.5 × Haber Mínimo`
- Ejemplo con mínimo $370.000: PBU = $925.000

#### 2. PC — Prestación Compensatoria (Art. 23-25)
- Reconoce años trabajados antes de julio 1994 (antes del SIJP).
- **Fórmula:** `PC = 1.5% × años_pre_SIJP × PBCI`
- PBCI = promedio de las mejores remuneraciones históricas (hasta 120 meses)

#### 3. PAP — Prestación Adicional por Permanencia (Art. 30-31)
- Reconoce años trabajados desde julio 1994 en adelante.
- **Fórmula:** `PAP = 0.85% × años_post_SIJP × PBCI`

**Total:** `Haber = PBU + PC + PAP` (mínimo garantizado siempre aplicado)

---

### RIPTE
Remuneración Imponible Promedio de los Trabajadores Estables. Publicado mensualmente por el MTEySS. Mide el salario promedio de los trabajadores en blanco y se usa como base de los ajustes previsionales.

---

### Movilidad Previsional

| Período | Ley | Frecuencia | Fórmula |
|---------|-----|-----------|---------|
| 2009–2017 | Ley 26.417 | Trimestral | max(RIPTE, Recaudación) |
| 2018–2019 | Ley 27.426 | Trimestral | Solo RIPTE |
| 2020 | DNU 163/2020 | Discrecional | Decreto presidencial |
| 2021–2024 | Ley 27.609 | Trimestral | max(IPC, RIPTE) |
| 2024→ | DL 274/2024 | Mensual | IPC del mes anterior |

---

### Descuentos
- **PAMI:** 3% del haber bruto (Ley 19.032) — automático en cada liquidación.

---

### Flujo de trabajo

```
Crear afiliado → Cargar períodos laborales → Cargar remuneraciones
→ Recalcular haber → Generar liquidación → Autorizar → Marcar como pagado
```

---

## API Endpoints

| Método | Endpoint | Descripción |
|--------|---------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/affiliates/` | Listar afiliados |
| POST | `/api/affiliates/` | Crear afiliado |
| POST | `/api/affiliates/{id}/recalcular` | Recalcular haber |
| POST | `/api/liquidations/calcular` | Calcular (sin guardar) |
| POST | `/api/liquidations/` | Generar liquidación |
| POST | `/api/liquidations/{id}/autorizar` | Autorizar pago |
| GET | `/api/ripte/` | Tabla RIPTE histórica |
| GET | `/api/movilidad/tabla` | Coeficientes de movilidad |
| GET | `/api/reports/dashboard` | Estadísticas generales |

Documentación completa: **http://localhost:8000/docs**