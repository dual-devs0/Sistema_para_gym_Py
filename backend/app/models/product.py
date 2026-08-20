import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class Product(Base, TimestampMixin, UUIDMixin):
    """A cantina product sold alongside memberships. Deactivated (is_active
    = False) instead of deleted so historical PaymentItem rows keep a valid
    reference and past sales stay intact."""

    gym_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("gym.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class PaymentItem(Base, TimestampMixin, UUIDMixin):
    """One cantina product line within a Payment. unit_price is a snapshot
    of Product.price at sale time — it must never drift if the product's
    price changes later, so it does NOT reference Product.price live."""

    payment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("payment.id"), nullable=False, index=True
    )  # noqa: E501
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product.id"), nullable=False, index=True
    )  # noqa: E501
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    payment = relationship("Payment", backref="items")
    product = relationship("Product")
