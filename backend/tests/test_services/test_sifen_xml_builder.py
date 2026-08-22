from datetime import UTC, datetime
from decimal import Decimal

from lxml import etree

from app.services.sifen_xml_builder import build_de_xml

NS = "http://ekuatia.set.gov.py/sifen/xsd"


def _build(**overrides) -> etree._Element:
    kwargs = dict(
        cdc="0" * 44,
        numero_timbrado="12345678",
        establecimiento="001",
        punto_expedicion="001",
        numero_documento=1,
        fecha_inicio_timbrado="2026-01-01",
        fecha_emision=datetime(2026, 8, 18, 10, 30, 0, tzinfo=UTC),
        ruc_sin_dv="4444401",
        dv_ruc="7",
        tipo_contribuyente="2",
        razon_social_emisor="Gimnasio Test SA",
        direccion_emisor="Av. Test 123",
        nombre_receptor=None,
        item_descripcion="Membresia mensual",
        monto=Decimal("150000"),
        environment="test",
    )
    kwargs.update(overrides)
    xml_bytes = build_de_xml(**kwargs)
    return etree.fromstring(xml_bytes)


def _find(root, path: str):
    return root.find(path, {"": NS})


def test_root_structure_and_cdc_as_de_id():
    root = _build(cdc="1" * 44)
    assert root.tag == f"{{{NS}}}rDE"
    assert _find(root, "dVerFor").text == "150"
    de = _find(root, "DE")
    assert de is not None
    assert de.get("Id") == "1" * 44


def test_environment_test_forces_mandatory_disclaimer_on_emisor_name():
    # D105 in Manual Tecnico v150: test-environment DE must carry this exact
    # literal in dNomEmi, not the real razon social.
    root = _build(environment="test", razon_social_emisor="Real Gym SA")
    nom_emi = root.find(f".//{{{NS}}}dNomEmi")
    assert nom_emi.text == "DE generado en ambiente de prueba - sin valor comercial ni fiscal"


def test_environment_production_uses_real_razon_social():
    root = _build(environment="production", razon_social_emisor="Real Gym SA")
    nom_emi = root.find(f".//{{{NS}}}dNomEmi")
    assert nom_emi.text == "Real Gym SA"


def test_receptor_defaults_to_consumidor_final_innominado():
    root = _build(nombre_receptor=None)
    assert root.find(f".//{{{NS}}}dNomRec").text == "Sin Nombre"
    assert root.find(f".//{{{NS}}}iNatRec").text == "2"
    assert root.find(f".//{{{NS}}}iTipIDRec").text == "5"


def test_receptor_uses_given_name_when_present():
    root = _build(nombre_receptor="Marcus Aurelio")
    assert root.find(f".//{{{NS}}}dNomRec").text == "Marcus Aurelio"


def test_iva_10_percent_math_on_totals():
    root = _build(monto=Decimal("110000"))
    # 110000 gross at 10% IVA -> base gravada 100000, IVA 10000
    assert root.find(f".//{{{NS}}}dBasGravIVA").text == "100000"
    assert root.find(f".//{{{NS}}}dLiqIVAItem").text == "10000"
    assert root.find(f".//{{{NS}}}dIVA10").text == "10000"
    assert root.find(f".//{{{NS}}}dTotGralOpe").text == "110000"


def test_timbrado_fields_present_in_gtimb():
    root = _build(numero_timbrado="87654321", establecimiento="002", punto_expedicion="003", numero_documento=42)
    g_timb = root.find(f".//{{{NS}}}gTimb")
    assert g_timb.find(f"{{{NS}}}dNumTim").text == "87654321"
    assert g_timb.find(f"{{{NS}}}dEst").text == "002"
    assert g_timb.find(f"{{{NS}}}dPunExp").text == "003"
    assert g_timb.find(f"{{{NS}}}dNumDoc").text == "0000042"
