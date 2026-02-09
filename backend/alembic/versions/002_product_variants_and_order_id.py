"""add product_variants, variant_id, external_orders.order_id

Revision ID: 002_variants
Revises: 001_initial
Create Date: 2025-02-09

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "002_variants"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "product_variants",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("external_variant_id", sa.String(255), nullable=True),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("sku", sa.String(100), nullable=True),
        sa.Column("price_krw", sa.Numeric(12, 0), nullable=True),
        sa.Column("stock", sa.Integer(), default=0),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_product_variants_product_id", "product_variants", ["product_id"])

    op.add_column("cart_items", sa.Column("variant_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_cart_items_variant_id",
        "cart_items",
        "product_variants",
        ["variant_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_cart_items_variant_id", "cart_items", ["variant_id"])

    op.add_column("order_items", sa.Column("variant_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_order_items_variant_id",
        "order_items",
        "product_variants",
        ["variant_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.add_column("external_orders", sa.Column("order_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_external_orders_order_id",
        "external_orders",
        "orders",
        ["order_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_external_orders_order_id", "external_orders", ["order_id"])


def downgrade() -> None:
    op.drop_index("ix_external_orders_order_id", "external_orders")
    op.drop_constraint("fk_external_orders_order_id", "external_orders", type_="foreignkey")
    op.drop_column("external_orders", "order_id")

    op.drop_constraint("fk_order_items_variant_id", "order_items", type_="foreignkey")
    op.drop_column("order_items", "variant_id")

    op.drop_index("ix_cart_items_variant_id", "cart_items")
    op.drop_constraint("fk_cart_items_variant_id", "cart_items", type_="foreignkey")
    op.drop_column("cart_items", "variant_id")

    op.drop_index("ix_product_variants_product_id", "product_variants")
    op.drop_table("product_variants")
