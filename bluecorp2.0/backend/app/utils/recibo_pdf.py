"""
Generador de Recibo de Haberes en PDF
======================================
Genera el recibo oficial de cobro del beneficiario, con:
  - Datos del beneficiario y beneficio
  - Detalle de haberes (PBU, PC, PAP, movilidad)
  - Detalle de descuentos (PAMI, voluntarios)
  - Haber neto a cobrar
  - Forma y lugar de pago
  - Período y fecha de emisión
"""

import io
from datetime import date
from typing import Optional, List

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm, mm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


AZUL_CORP = colors.HexColor("#1565c0") if REPORTLAB_AVAILABLE else None
AZUL_CLARO = colors.HexColor("#e3f2fd") if REPORTLAB_AVAILABLE else None


def generar_recibo_pdf(
    afiliado_nombre: str,
    afiliado_cuil: str,
    numero_beneficio: str,
    tipo_prestacion: str,
    periodo: str,
    items_haber: List[dict],
    items_descuento: List[dict],
    haber_bruto: float,
    total_descuentos: float,
    haber_neto: float,
    banco: Optional[str] = None,
    cbu: Optional[str] = None,
    forma_pago: str = "Acreditación bancaria",
    numero_liquidacion: str = "",
) -> bytes:
    """
    Genera un PDF con el recibo de haberes y retorna los bytes.
    """
    if not REPORTLAB_AVAILABLE:
        return b"%PDF-1.4 % recibo no disponible (instale reportlab)"

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )

    styles = getSampleStyleSheet()
    estilo_titulo = ParagraphStyle(
        "titulo", parent=styles["Heading1"],
        fontSize=16, textColor=AZUL_CORP, alignment=TA_CENTER, spaceAfter=4
    )
    estilo_subtitulo = ParagraphStyle(
        "subtitulo", parent=styles["Normal"],
        fontSize=9, textColor=colors.grey, alignment=TA_CENTER
    )
    estilo_label = ParagraphStyle(
        "label", parent=styles["Normal"], fontSize=8, textColor=colors.grey
    )
    estilo_valor = ParagraphStyle(
        "valor", parent=styles["Normal"], fontSize=10, fontName="Helvetica-Bold"
    )
    estilo_neto = ParagraphStyle(
        "neto", parent=styles["Normal"],
        fontSize=14, fontName="Helvetica-Bold",
        textColor=colors.white, alignment=TA_CENTER
    )

    story = []

    # ── Encabezado ────────────────────────────────────────────────────────
    story.append(Paragraph("BLUE CORP", estilo_titulo))
    story.append(Paragraph("Sistema de Gestión Previsional", estilo_subtitulo))
    story.append(Spacer(1, 3 * mm))
    story.append(HRFlowable(width="100%", thickness=2, color=AZUL_CORP))
    story.append(Spacer(1, 3 * mm))

    titulo_recibo = ParagraphStyle(
        "titulo_recibo", parent=styles["Heading2"],
        fontSize=13, textColor=AZUL_CORP, alignment=TA_CENTER
    )
    story.append(Paragraph(f"RECIBO DE HABERES — {periodo}", titulo_recibo))
    story.append(Spacer(1, 4 * mm))

    # ── Datos del beneficiario ────────────────────────────────────────────
    datos_ben = [
        ["BENEFICIARIO", afiliado_nombre.upper(), "N° BENEFICIO", numero_beneficio],
        ["CUIL", afiliado_cuil, "TIPO PRESTACIÓN", tipo_prestacion],
        ["PERÍODO", periodo, "N° LIQUIDACIÓN", numero_liquidacion or "-"],
    ]
    t_ben = Table(datos_ben, colWidths=[3.5 * cm, 7.5 * cm, 3.5 * cm, 4.5 * cm])
    t_ben.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), AZUL_CLARO),
        ("BACKGROUND", (2, 0), (2, -1), AZUL_CLARO),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("PADDING", (0, 0), (-1, -1), 4),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#f8f9fa")]),
    ]))
    story.append(t_ben)
    story.append(Spacer(1, 5 * mm))

    # ── Haberes ───────────────────────────────────────────────────────────
    story.append(Paragraph("HABERES", ParagraphStyle("sec", parent=styles["Normal"],
        fontSize=9, fontName="Helvetica-Bold", textColor=AZUL_CORP, spaceBefore=4)))
    story.append(Spacer(1, 1 * mm))

    tabla_haberes = [["Código", "Concepto", "Base", "%", "Importe"]]
    for item in items_haber:
        tabla_haberes.append([
            item.get("codigo_concepto", ""),
            item.get("concepto", ""),
            f"$ {item.get('base_calculo', 0):,.2f}" if item.get("base_calculo") else "",
            f"{item.get('porcentaje', 0):.2f}%" if item.get("porcentaje") else "",
            f"$ {item.get('importe', 0):,.2f}",
        ])

    t_hab = Table(
        tabla_haberes,
        colWidths=[1.5 * cm, 8.5 * cm, 3.5 * cm, 2 * cm, 3.5 * cm]
    )
    t_hab.setStyle(_estilo_tabla(AZUL_CORP, AZUL_CLARO, header=True))
    story.append(t_hab)
    story.append(Spacer(1, 4 * mm))

    # ── Descuentos ────────────────────────────────────────────────────────
    story.append(Paragraph("DESCUENTOS", ParagraphStyle("sec2", parent=styles["Normal"],
        fontSize=9, fontName="Helvetica-Bold", textColor=colors.red, spaceBefore=4)))
    story.append(Spacer(1, 1 * mm))

    tabla_desc = [["Código", "Concepto", "Base", "%", "Importe"]]
    for item in items_descuento:
        tabla_desc.append([
            item.get("codigo_concepto", ""),
            item.get("concepto", ""),
            f"$ {item.get('base_calculo', 0):,.2f}" if item.get("base_calculo") else "",
            f"{item.get('porcentaje', 0):.2f}%" if item.get("porcentaje") else "",
            f"$ {item.get('importe', 0):,.2f}",
        ])

    t_des = Table(
        tabla_desc,
        colWidths=[1.5 * cm, 8.5 * cm, 3.5 * cm, 2 * cm, 3.5 * cm]
    )
    t_des.setStyle(_estilo_tabla(colors.red, colors.HexColor("#fff3f3"), header=True))
    story.append(t_des)
    story.append(Spacer(1, 5 * mm))

    # ── Resumen final ─────────────────────────────────────────────────────
    resumen = [
        ["HABER BRUTO", f"$ {haber_bruto:,.2f}"],
        ["(-) TOTAL DESCUENTOS", f"$ {total_descuentos:,.2f}"],
    ]
    t_res = Table(resumen, colWidths=[14 * cm, 5 * cm])
    t_res.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTNAME", (1, 1), (1, 1), "Helvetica-Bold"),
        ("TEXTCOLOR", (1, 1), (1, 1), colors.red),
        ("LINEABOVE", (0, 0), (-1, 0), 0.5, colors.lightgrey),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t_res)

    # Haber neto destacado
    t_neto = Table(
        [["HABER NETO A COBRAR", f"$ {haber_neto:,.2f}"]],
        colWidths=[14 * cm, 5 * cm]
    )
    t_neto.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), AZUL_CORP),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 13),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(t_neto)
    story.append(Spacer(1, 5 * mm))

    # ── Datos de pago ─────────────────────────────────────────────────────
    story.append(Paragraph("INFORMACIÓN DE PAGO", ParagraphStyle("sec3", parent=styles["Normal"],
        fontSize=9, fontName="Helvetica-Bold", textColor=AZUL_CORP)))
    story.append(Spacer(1, 1 * mm))

    pago_data = [
        ["Forma de pago:", forma_pago],
        ["Banco:", banco or "—"],
        ["CBU:", cbu or "—"],
        ["Fecha de emisión:", date.today().strftime("%d/%m/%Y")],
    ]
    t_pago = Table(pago_data, colWidths=[4 * cm, 15 * cm])
    t_pago.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("PADDING", (0, 0), (-1, -1), 3),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.grey),
    ]))
    story.append(t_pago)
    story.append(Spacer(1, 8 * mm))

    # ── Pie de página ─────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey))
    story.append(Spacer(1, 2 * mm))
    pie = ParagraphStyle("pie", parent=styles["Normal"],
        fontSize=7, textColor=colors.grey, alignment=TA_CENTER)
    story.append(Paragraph(
        "Este recibo es un comprobante de pago de haberes previsionales. "
        "Blue Corp — Sistema de Gestión Previsional | Ley 24.241 SIPA",
        pie
    ))

    doc.build(story)
    return buffer.getvalue()


def _estilo_tabla(color_header, color_header_bg, header=True):
    estilos = [
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("PADDING", (0, 0), (-1, -1), 4),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.lightgrey),
        ("ALIGN", (4, 0), (4, -1), "RIGHT"),
        ("ALIGN", (3, 0), (3, -1), "RIGHT"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f9fa")]),
    ]
    if header:
        estilos += [
            ("BACKGROUND", (0, 0), (-1, 0), color_header_bg),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("TEXTCOLOR", (0, 0), (-1, 0), color_header),
        ]
    return TableStyle(estilos)
