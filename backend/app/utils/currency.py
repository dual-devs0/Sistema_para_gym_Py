CASH_ROUNDING_STEP = 50


def round_cash_pyg(amount: float) -> int:
    """Round a cash-collected amount to the nearest 50 PYG.

    Cash registers in Paraguay don't handle coins below 50 Gs, so
    change/charges in cash are rounded to that step. Only applies to the
    final amount actually collected in cash, not to plan base prices.
    """
    return round(amount / CASH_ROUNDING_STEP) * CASH_ROUNDING_STEP
