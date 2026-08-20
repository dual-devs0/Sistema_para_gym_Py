"""CDC (Codigo de Control) construction for SIFEN electronic documents.

Field layout (44 chars total) — CONFIRMED empirically by decoding the worked
example printed in Manual Tecnico v150 sec. 10.1
("0144 4444 0170 0100 1001 4528 2201 7012 5158 7326 0988"): the manual's own
"Conformacion del CDC" table is an embedded image that doesn't extract as
text, but decoding this example at the byte offsets below yields a
syntactically valid date (2017-01-25) at exactly the expected position,
which is strong evidence the layout is correct — not guessed from
third-party blogs.

    [0:2]   tipo de documento electronico (dTiDE), e.g. "01" = Factura Electronica
    [2:10]  RUC del emisor sin DV, zero-padded to 8 digits
    [10:11] DV del RUC del emisor
    [11:14] establecimiento (3 digits)
    [14:17] punto de expedicion (3 digits)
    [17:24] numero del documento (7 digits)
    [24:25] tipo de contribuyente (1=fisica, 2=juridica)
    [25:33] fecha de emision, AAAAMMDD
    [33:34] tipo de emision (1=normal, 2=contingencia)
    [34:43] codigo de seguridad (9 digits, random, non-sequential per sec. 10.3)
    [43:44] digito verificador del CDC (modulo 11) — see calculate_check_digit()
    for the algorithm source, confirmed against the official DNIT PL/SQL function.
"""

import random
from datetime import date


def generate_codigo_seguridad() -> str:
    # Sec. 10.3: 9-digit random, non-sequential, unrelated to any DE/emitter data.
    return f"{random.randint(1, 999_999_999):09d}"


def _require_len(name: str, value: str, length: int) -> None:
    if len(value) > length:
        raise ValueError(f"{name} must be at most {length} chars, got {len(value)!r}: {value!r}")


def build_cdc_base(
    tipo_documento: str,
    ruc_sin_dv: str,
    dv_ruc: str,
    establecimiento: str,
    punto_expedicion: str,
    numero_documento: int,
    tipo_contribuyente: str,
    fecha_emision: date,
    tipo_emision: str,
    codigo_seguridad: str,
) -> str:
    """Builds the first 43 chars of the CDC (everything except the check digit)."""
    _require_len("tipo_documento", tipo_documento, 2)
    _require_len("ruc_sin_dv", ruc_sin_dv, 8)
    _require_len("dv_ruc", dv_ruc, 1)
    _require_len("establecimiento", establecimiento, 3)
    _require_len("punto_expedicion", punto_expedicion, 3)
    if numero_documento > 9_999_999:
        raise ValueError(f"numero_documento must fit in 7 digits, got {numero_documento}")
    _require_len("tipo_contribuyente", tipo_contribuyente, 1)
    _require_len("tipo_emision", tipo_emision, 1)
    _require_len("codigo_seguridad", codigo_seguridad, 9)
    return (
        f"{tipo_documento:0>2}"
        f"{ruc_sin_dv:0>8}"
        f"{dv_ruc:0>1}"
        f"{establecimiento:0>3}"
        f"{punto_expedicion:0>3}"
        f"{numero_documento:07d}"
        f"{tipo_contribuyente:0>1}"
        f"{fecha_emision.strftime('%Y%m%d')}"
        f"{tipo_emision:0>1}"
        f"{codigo_seguridad:0>9}"
    )


def calculate_check_digit(cdc_base: str, basemax: int = 11) -> str:
    """Modulo-11 check digit — CONFIRMED, direct line-by-line translation of
    the official DNIT PL/SQL function `Pa_Calcular_Dv_11_A`, extracted from
    "Digito Verificador.pdf" (dnit.gov.py/documents/20123/224893/...,
    a Word doc from 2013-11-20, also ships C and VB versions of the same
    function — all three agree).

    Verified against the manual's own worked CDC example
    ("0144 4444 0170 0100 1001 4528 2201 7012 5158 7326 0988", Manual
    Tecnico v150 sec. 7.6): this implementation reproduces its check digit
    (8) exactly — see test_sifen_cdc.py::test_reproduces_manual_worked_example.
    A second example from a commercial provider's docs (sifende.com.py) did
    NOT reproduce with this algorithm, but that page's CDC uses suspiciously
    round placeholder values (numero=0000001, codigo_seguridad=000000000)
    consistent with an illustrative, non-computed example rather than a real
    one — the official-source match takes precedence.

    Original PL/SQL (weight starts at 2, increments every digit scanned
    right-to-left, resets to 2 once it exceeds basemax=11; digit=0 when
    remainder is 0 or 1, not just 0):

        k := 2; v_total := 0;
        FOR i IN REVERSE 1 .. LENGTH(v_numero_al) LOOP
          IF k > p_basemax THEN k := 2; END IF;
          v_total := v_total + (TO_NUMBER(SUBSTR(v_numero_al,i,1)) * k);
          k := k + 1;
        END LOOP;
        v_resto := MOD(v_total,11);
        IF v_resto > 1 THEN v_digit := 11 - v_resto; ELSE v_digit := 0; END IF;
    """
    if len(cdc_base) != 43:
        raise ValueError(f"cdc_base must be 43 chars, got {len(cdc_base)}")
    k = 2
    total = 0
    for digit in reversed(cdc_base):
        if k > basemax:
            k = 2
        total += int(digit) * k
        k += 1
    resto = total % 11
    dv = 11 - resto if resto > 1 else 0
    return str(dv)


def build_cdc(
    tipo_documento: str,
    ruc_sin_dv: str,
    dv_ruc: str,
    establecimiento: str,
    punto_expedicion: str,
    numero_documento: int,
    tipo_contribuyente: str,
    fecha_emision: date,
    tipo_emision: str,
    codigo_seguridad: str | None = None,
) -> str:
    base = build_cdc_base(
        tipo_documento,
        ruc_sin_dv,
        dv_ruc,
        establecimiento,
        punto_expedicion,
        numero_documento,
        tipo_contribuyente,
        fecha_emision,
        tipo_emision,
        codigo_seguridad or generate_codigo_seguridad(),
    )
    return base + calculate_check_digit(base)
