"""Builds the unsigned DE (Documento Electronico) XML for a payment.

MVP scope, explicitly reduced per plan: single-item Factura Electronica
(iTiDE=1), operacion al contado (cash), IVA 10% (gimnasio = prestacion de
servicios), receptor "Consumidor Final" (innominado) unless the member has
a RUC on file (out of scope for this MVP — member.ruc doesn't exist yet).
Discounts, multi-item, credit notes, D2.1/D2.2 groups etc. are NOT covered
here — flagged as follow-up work in the Fase 3 plan.

Every tag name below is sourced directly from the field tables in Manual
Tecnico SIFEN v150 (sections C, D, E7, E8, F — extracted as text, grep'd and
read section by section). The nesting (which group is a child of which) is
built from the "Nodo Padre" column of those same tables, but was NOT
cross-checked against the actual XSD file (siRecepDE_v150.xsd) referenced by
the manual — that file wasn't downloaded in this session. Validate against
the real XSD, or a real sifen-test.set.gov.py rejection/acceptance, before
trusting this structurally for a live submission (Sub-entrega 3b).
"""

from datetime import datetime
from decimal import ROUND_HALF_UP, Decimal

from lxml import etree

NSMAP = {None: "http://ekuatia.set.gov.py/sifen/xsd", "xsi": "http://www.w3.org/2001/XMLSchema-instance"}

IVA_RATE = Decimal("10")  # 10% — servicios gravados, tasa general


def _el(parent: etree._Element, tag: str, text: str | None = None) -> etree._Element:
    child = etree.SubElement(parent, tag)
    if text is not None:
        child.text = text
    return child


def _money(value: Decimal) -> str:
    return str(value.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def build_de_xml(
    *,
    cdc: str,
    numero_timbrado: str,
    establecimiento: str,
    punto_expedicion: str,
    numero_documento: int,
    fecha_inicio_timbrado: str,
    fecha_emision: datetime,
    ruc_sin_dv: str,
    dv_ruc: str,
    tipo_contribuyente: str,
    razon_social_emisor: str,
    direccion_emisor: str,
    nombre_receptor: str | None,
    item_descripcion: str,
    monto: Decimal,
    environment: str,
) -> bytes:
    root = etree.Element("rDE", nsmap=NSMAP)
    _el(root, "dVerFor", "150")

    de = etree.SubElement(root, "DE", Id=cdc)

    # C — gTimb (datos del timbrado)
    g_timb = _el(de, "gTimb")
    _el(g_timb, "iTiDE", "1")
    _el(g_timb, "dDesTiDE", "Factura electrónica")
    _el(g_timb, "dNumTim", numero_timbrado)
    _el(g_timb, "dEst", establecimiento)
    _el(g_timb, "dPunExp", punto_expedicion)
    _el(g_timb, "dNumDoc", f"{numero_documento:07d}")
    _el(g_timb, "dFeIniT", fecha_inicio_timbrado)

    # D001 — gDatGralOpe
    g_dat_gral = _el(de, "gDatGralOpe")
    _el(g_dat_gral, "dFeEmiDE", fecha_emision.strftime("%Y-%m-%dT%H:%M:%S"))

    # D010 — gOpeCom
    g_ope_com = _el(g_dat_gral, "gOpeCom")
    _el(g_ope_com, "iTipTra", "2")
    _el(g_ope_com, "dDesTipTra", "Prestación de servicios")
    _el(g_ope_com, "iTImp", "1")
    _el(g_ope_com, "dDesTImp", "IVA")
    _el(g_ope_com, "cMoneOpe", "PYG")
    _el(g_ope_com, "dDesMoneOpe", "Guarani")

    # D100 — gEmis. dNomEmi carries the mandatory test-environment literal
    # per D105's own "Observaciones" column when environment == "test".
    g_emis = _el(g_dat_gral, "gEmis")
    _el(g_emis, "dRucEm", ruc_sin_dv)
    _el(g_emis, "dDVEmi", dv_ruc)
    _el(g_emis, "iTipCont", tipo_contribuyente)
    nombre_emisor = razon_social_emisor
    if environment == "test":
        nombre_emisor = "DE generado en ambiente de prueba - sin valor comercial ni fiscal"
    _el(g_emis, "dNomEmi", nombre_emisor)
    _el(g_emis, "dDirEmi", direccion_emisor or "S/D")
    _el(g_emis, "dNumCas", "0")

    # D200 — gDatRec. Consumidor final / innominado per D211's own rule.
    g_dat_rec = _el(g_dat_gral, "gDatRec")
    _el(g_dat_rec, "iNatRec", "2")
    _el(g_dat_rec, "iTiOpe", "2")
    _el(g_dat_rec, "cPaisRec", "PRY")
    _el(g_dat_rec, "dDesPaisRe", "Paraguay")
    _el(g_dat_rec, "iTipIDRec", "5")
    _el(g_dat_rec, "dDTipIDRec", "Innominado")
    _el(g_dat_rec, "dNumIDRec", "0")
    _el(g_dat_rec, "dNomRec", nombre_receptor or "Sin Nombre")

    # E001 — gDtipDE
    g_dtip_de = _el(de, "gDtipDE")
    g_cam_fe = _el(g_dtip_de, "gCamFE")
    _el(g_cam_fe, "iIndPres", "1")
    _el(g_cam_fe, "dDesIndPres", "Operación presencial")

    # E700 — gCamItem (single item, MVP)
    base_gravada = (monto / (Decimal("1") + IVA_RATE / Decimal("100"))).quantize(
        Decimal("1"), rounding=ROUND_HALF_UP
    )
    liq_iva = (base_gravada * IVA_RATE / Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)

    g_cam_item = _el(g_dtip_de, "gCamItem")
    _el(g_cam_item, "dCodInt", "MEMBRESIA")
    _el(g_cam_item, "dDesProSer", item_descripcion[:120])
    _el(g_cam_item, "cUniMed", "77")
    _el(g_cam_item, "dDesUniMed", "UNI")
    _el(g_cam_item, "dCantProSer", "1")

    g_valor_item = _el(g_cam_item, "gValorItem")
    _el(g_valor_item, "dPUniProSer", _money(monto))
    _el(g_valor_item, "dTotBruOpeItem", _money(monto))

    g_cam_iva = _el(g_cam_item, "gCamIVA")
    _el(g_cam_iva, "iAfecIVA", "1")
    _el(g_cam_iva, "dDesAfecIVA", "Gravado IVA")
    _el(g_cam_iva, "dPropIVA", "100")
    _el(g_cam_iva, "dTasaIVA", "10")
    _el(g_cam_iva, "dBasGravIVA", _money(base_gravada))
    _el(g_cam_iva, "dLiqIVAItem", _money(liq_iva))

    # E600 — gCamCond (contado)
    g_cam_cond = _el(g_dtip_de, "gCamCond")
    _el(g_cam_cond, "iCondOpe", "1")
    _el(g_cam_cond, "dDCondOpe", "Contado")
    g_pa_con_eini = _el(g_cam_cond, "gPaConEIni")
    _el(g_pa_con_eini, "iTiPago", "1")
    _el(g_pa_con_eini, "dDesTiPag", "Efectivo")
    _el(g_pa_con_eini, "dMonTiPag", _money(monto))
    _el(g_pa_con_eini, "cMoneTiPag", "PYG")

    # F001 — gTotSub
    g_tot_sub = _el(de, "gTotSub")
    _el(g_tot_sub, "dSub10", _money(monto))
    _el(g_tot_sub, "dTotOpe", _money(monto))
    _el(g_tot_sub, "dTotDesc", "0")
    _el(g_tot_sub, "dTotDescGlotem", "0")
    _el(g_tot_sub, "dTotAntItem", "0")
    _el(g_tot_sub, "dTotAnt", "0")
    _el(g_tot_sub, "dPorcDescTotal", "0")
    _el(g_tot_sub, "dDescTotal", "0")
    _el(g_tot_sub, "dAnticipo", "0")
    _el(g_tot_sub, "dRedon", "0")
    _el(g_tot_sub, "dTotGralOpe", _money(monto))
    _el(g_tot_sub, "dIVA10", _money(liq_iva))

    return etree.tostring(root, xml_declaration=True, encoding="UTF-8")
