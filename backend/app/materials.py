from __future__ import annotations

import re


SPACE_RE = re.compile(r"\s+")


def normalize_material_text(value: str) -> str:
    return SPACE_RE.sub(" ", value.strip().lower())


def build_material_key(name: str, coupang_link: str | None, product_id: str | None) -> str:
    clean_product_id = (product_id or "").strip()
    clean_link = (coupang_link or "").strip()
    if clean_product_id:
        return f"product:{clean_product_id}"
    if clean_link:
        return f"link:{clean_link.lower()}"
    return f"name:{normalize_material_text(name)}"


def compute_price_per_g(price: int | float, weight_g: int | float) -> float:
    if not weight_g:
        return 0.0
    return round(float(price) / float(weight_g), 4)


def merge_seed_sources(existing: list[str] | None, *sources: str | None) -> list[str]:
    merged: list[str] = []
    for value in (existing or []):
        text = value.strip()
        if text and text not in merged:
            merged.append(text)
    for value in sources:
        text = (value or "").strip()
        if text and text not in merged:
            merged.append(text)
    return merged
