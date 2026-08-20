import datetime as dt

import pytest
from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID
from lxml import etree
from signxml import XMLVerifier
from signxml.exceptions import SignXMLException

from app.services.sifen_signer import sign_de_xml
from app.services.sifen_xml_builder import build_de_xml

NS = "http://ekuatia.set.gov.py/sifen/xsd"


@pytest.fixture
def throwaway_cert():
    # Self-signed, 1-day validity, generated fresh per test run. This proves
    # only the XML-DSig mechanics (enveloped, exc-c14n, rsa-sha256) — NOT
    # that a real PSC-issued certificate or SIFEN itself will accept it.
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "RUC4444401-7")])
    cert = (
        x509.CertificateBuilder()
        .subject_name(name)
        .issuer_name(name)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(dt.datetime.now(dt.UTC))
        .not_valid_after(dt.datetime.now(dt.UTC) + dt.timedelta(days=1))
        .sign(key, hashes.SHA256())
    )
    return key, cert


def _unsigned_xml(cdc: str) -> bytes:
    from decimal import Decimal

    return build_de_xml(
        cdc=cdc,
        numero_timbrado="12345678",
        establecimiento="001",
        punto_expedicion="001",
        numero_documento=1,
        fecha_inicio_timbrado="2026-01-01",
        fecha_emision=dt.datetime.now(dt.UTC),
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


def test_signature_is_sibling_of_de_under_rde(throwaway_cert):
    key, cert = throwaway_cert
    cdc = "1" * 44
    signed = sign_de_xml(_unsigned_xml(cdc), key, cert, cdc)
    root = etree.fromstring(signed)
    assert root.tag == f"{{{NS}}}rDE"
    children_tags = [etree.QName(c).localname for c in root]
    assert "DE" in children_tags
    assert "Signature" in children_tags


def test_signed_xml_verifies_against_the_signing_cert(throwaway_cert):
    key, cert = throwaway_cert
    cdc = "2" * 44
    signed = sign_de_xml(_unsigned_xml(cdc), key, cert, cdc)
    verified = XMLVerifier().verify(signed, x509_cert=cert)
    assert verified.signed_xml is not None


def test_tampered_xml_fails_verification(throwaway_cert):
    key, cert = throwaway_cert
    cdc = "3" * 44
    signed = sign_de_xml(_unsigned_xml(cdc), key, cert, cdc)
    tampered = signed.replace(b"Av. Test 123", b"Otra Direccion 456")
    with pytest.raises(SignXMLException):
        XMLVerifier().verify(tampered, x509_cert=cert)
