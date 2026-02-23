from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.api.deps import get_current_user, require_operador
from app.models.user import User
from app.models.ripte import TablaRIPTE
from app.schemas.ripte import RIPTECreate, RIPTEUpdate, RIPTEResponse
from app.engines.ripte_data import RIPTE_HISTORICO

router = APIRouter(prefix="/ripte", tags=["RIPTE"])


@router.post("/cargar-historico", status_code=201)
def cargar_datos_historicos(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    """Carga la tabla histórica de RIPTE en la base de datos."""
    insertados = 0
    for entry in RIPTE_HISTORICO:
        if not db.query(TablaRIPTE).filter(TablaRIPTE.periodo == entry["periodo"]).first():
            registro = TablaRIPTE(
                periodo=entry["periodo"],
                valor=entry["valor"],
            )
            db.add(registro)
            insertados += 1
    db.commit()
    return {"message": f"Se cargaron {insertados} registros históricos de RIPTE"}


@router.get("/", response_model=List[RIPTEResponse])
def listar_ripte(
    skip: int = 0,
    limit: int = 200,
    desde: Optional[str] = None,
    hasta: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(TablaRIPTE)
    if desde:
        query = query.filter(TablaRIPTE.periodo >= desde)
    if hasta:
        query = query.filter(TablaRIPTE.periodo <= hasta)
    return query.order_by(TablaRIPTE.periodo.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=RIPTEResponse, status_code=201)
def crear_ripte(
    data: RIPTECreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    if db.query(TablaRIPTE).filter(TablaRIPTE.periodo == data.periodo).first():
        raise HTTPException(status_code=400, detail=f"Ya existe un registro RIPTE para {data.periodo}")
    registro = TablaRIPTE(**data.model_dump())
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return registro


@router.get("/ultimo")
def ultimo_ripte(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    registro = db.query(TablaRIPTE).order_by(TablaRIPTE.periodo.desc()).first()
    if not registro:
        # Devolver del histórico en memoria
        from app.engines.ripte_data import RIPTE_HISTORICO
        ultimo = RIPTE_HISTORICO[-1]
        return ultimo
    return {"periodo": registro.periodo, "valor": registro.valor}


@router.get("/{periodo}", response_model=RIPTEResponse)
def obtener_ripte(
    periodo: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    registro = db.query(TablaRIPTE).filter(TablaRIPTE.periodo == periodo).first()
    if not registro:
        raise HTTPException(status_code=404, detail=f"No se encontró RIPTE para {periodo}")
    return registro


@router.put("/{periodo}", response_model=RIPTEResponse)
def actualizar_ripte(
    periodo: str,
    data: RIPTEUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    registro = db.query(TablaRIPTE).filter(TablaRIPTE.periodo == periodo).first()
    if not registro:
        raise HTTPException(status_code=404, detail=f"No se encontró RIPTE para {periodo}")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(registro, field, value)
    db.commit()
    db.refresh(registro)
    return registro
