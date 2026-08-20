from datetime import date

import pytest

from app.services.sifen_cdc import build_cdc, build_cdc_base, calculate_check_digit


def test_build_cdc_base_is_43_chars_in_confirmed_field_order():
    base = build_cdc_base(
        tipo_documento="01",
        ruc_sin_dv="4444401",
        dv_ruc="7",
        establecimiento="001",
        punto_expedicion="001",
        numero_documento=1,
        tipo_contribuyente="2",
        fecha_emision=date(2026, 8, 18),
        tipo_emision="1",
        codigo_seguridad="123456789",
    )
    assert len(base) == 43
    assert base[0:2] == "01"  # tipo documento
    assert base[2:10] == "04444401"  # RUC zero-padded to 8
    assert base[10:11] == "7"  # DV RUC
    assert base[11:14] == "001"  # establecimiento
    assert base[14:17] == "001"  # punto expedicion
    assert base[17:24] == "0000001"  # numero documento, 7 digits
    assert base[24:25] == "2"  # tipo contribuyente
    assert base[25:33] == "20260818"  # fecha AAAAMMDD
    assert base[33:34] == "1"  # tipo emision
    assert base[34:43] == "123456789"  # codigo seguridad


def test_build_cdc_base_rejects_oversized_ruc():
    # 9-digit RUC doesn't fit the 8-digit field — surfacing this early beats
    # silently truncating a real taxpayer's RUC into an invalid CDC.
    with pytest.raises(ValueError):
        build_cdc_base(
            tipo_documento="01",
            ruc_sin_dv="123456789",
            dv_ruc="7",
            establecimiento="001",
            punto_expedicion="001",
            numero_documento=1,
            tipo_contribuyente="2",
            fecha_emision=date(2026, 8, 18),
            tipo_emision="1",
            codigo_seguridad="123456789",
        )


def test_calculate_check_digit_requires_43_chars():
    with pytest.raises(ValueError):
        calculate_check_digit("too short")


def test_calculate_check_digit_is_deterministic():
    base = "0" * 43
    assert calculate_check_digit(base) == calculate_check_digit(base)


def test_reproduces_manual_worked_example():
    # Frozen real-world case, not a made-up input: this is the exact CDC
    # printed in Manual Tecnico SIFEN v150 sec. 7.6 as the Signature example
    # ("0144 4444 0170 0100 1001 4528 2201 7012 5158 7326 0988"). The check
    # digit algorithm is a direct translation of the official DNIT PL/SQL
    # function Pa_Calcular_Dv_11_A (dnit.gov.py/documents/20123/224893/...).
    # This test is the hard evidence the implementation is correct — not an
    # assumption.
    base = "0144444401700100100145282201701251587326098"
    assert len(base) == 43
    assert calculate_check_digit(base) == "8"


def test_build_cdc_produces_44_char_code():
    cdc = build_cdc(
        tipo_documento="01",
        ruc_sin_dv="4444401",
        dv_ruc="7",
        establecimiento="001",
        punto_expedicion="001",
        numero_documento=1,
        tipo_contribuyente="2",
        fecha_emision=date(2026, 8, 18),
        tipo_emision="1",
        codigo_seguridad="123456789",
    )
    assert len(cdc) == 44
    assert cdc.isdigit()
