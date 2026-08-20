# WhatsApp message templates for 360dialog / Meta.
#
# WhatsApp requires business-initiated messages to use templates pre-approved
# in the Meta Business / 360dialog panel — this file is documentation of
# what to register there, NOT something the code can create on its own.
# `name` below must match the approved template name exactly.

PAYMENT_CONFIRMATION_TEMPLATE = "payment_confirmation"
PAYMENT_CONFIRMATION_TEXT = (
    "Hola {{1}}, tu pago de {{2}} en {{3}} fue registrado el {{4}}. ¡Gracias por tu confianza!"
)
# Params: 1) member name, 2) amount formatted as ₲ (format_pyg), 3) gym name, 4) date dd/mm/aaaa

EXPIRY_REMINDER_TEMPLATE = "expiry_reminder"
EXPIRY_REMINDER_TEXT = "Hola {{1}}, tu membresía en {{2}} vence el {{3}}. Renová a tiempo para no perder tu acceso."
# Params: 1) member name, 2) gym name, 3) expiry date dd/mm/aaaa

SHIFT_CLOSE_SUMMARY_TEMPLATE = "shift_close_summary"
SHIFT_CLOSE_SUMMARY_TEXT = (
    "Cierre de caja en {{1}}: efectivo {{2}}, tarjeta {{3}}, transferencia {{4}}, otro {{5}}. "
    "Salidas de dinero: {{6}}. Efectivo esperado en caja: {{7}}."
)
# Params: 1) gym name, 2-5) totals by method formatted as ₲ (format_pyg), 6) withdrawals total,
# 7) expected cash


def build_payment_confirmation_params(
    member_name: str, amount_text: str, gym_name: str, paid_at_text: str
) -> list[str]:
    return [member_name, amount_text, gym_name, paid_at_text]


def build_expiry_reminder_params(member_name: str, gym_name: str, end_date_text: str) -> list[str]:
    return [member_name, gym_name, end_date_text]


def build_shift_close_summary_params(
    gym_name: str, cash_text: str, card_text: str, transfer_text: str, other_text: str,
    withdrawals_text: str, expected_cash_text: str,
) -> list[str]:
    return [gym_name, cash_text, card_text, transfer_text, other_text, withdrawals_text, expected_cash_text]
