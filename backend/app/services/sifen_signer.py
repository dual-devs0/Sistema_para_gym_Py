"""XML-DSig signing per Manual Tecnico v150 sec. 7.6/7.7 — CONFIRMED spec:

- Enveloped signature, exc-c14n transform, rsa-sha256, digest sha256
- Reference URI points at the CDC (the DE group's Id attribute)
- Not XAdES — plain W3C xmldsig-core, verified directly against the manual's
  own worked example in this session (see sifen_cdc.py docstring).
- <Signature> is a sibling of <DE>, both children of <rDE> (per the
  manual's own Signature example in sec. 7.6) — so we sign the whole <rDE>
  root with method=enveloped, not just the <DE> subtree, so signxml appends
  <Signature> at the right level.

signxml is used because it's the standard Python library for this exact
W3C subset (enveloped + exc-c14n + custom reference URI), unlike XAdES-only
alternatives.
"""

from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateKey
from cryptography.x509 import Certificate
from lxml import etree
from signxml import SignatureConstructionMethod, SignatureMethod, XMLSigner


def sign_de_xml(xml_bytes: bytes, private_key: RSAPrivateKey, certificate: Certificate, cdc: str) -> bytes:
    """Signs an <rDE><DE Id="{cdc}">...</DE></rDE> document.

    `private_key`/`certificate` come from a gym's PSC-issued certificate in
    Sub-entrega 3b (currently blocked). This function itself is verifiable
    today with any throwaway self-signed test cert — that only proves the
    DSig mechanics are correct, not that a real PSC certificate/SIFEN will
    accept it.
    """
    signer = XMLSigner(
        method=SignatureConstructionMethod.enveloped,
        signature_algorithm=SignatureMethod.RSA_SHA256,
        digest_algorithm="sha256",
        c14n_algorithm="http://www.w3.org/2001/10/xml-exc-c14n#",
    )
    root = etree.fromstring(xml_bytes)
    signed_root = signer.sign(root, key=private_key, cert=[certificate], reference_uri=f"#{cdc}")
    return etree.tostring(signed_root, xml_declaration=True, encoding="UTF-8")
