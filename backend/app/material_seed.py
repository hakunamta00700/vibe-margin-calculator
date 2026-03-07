from __future__ import annotations

import csv
import json
import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from .config import LEGACY_INDEX_HTML_PATH, SEED_DATA_DIR
from .database import db_session
from .materials import build_material_key, merge_seed_sources
from .models import Material, utcnow


logger = logging.getLogger(__name__)

LEGACY_MATERIAL_RE = re.compile(
    r'\{\s*id:RID\(\),\s*name:"(?P<name>.*?)",\s*price:(?P<price>-?\d+(?:\.\d+)?),\s*weight:(?P<weight>-?\d+(?:\.\d+)?),\s*coupangLink:"(?P<link>.*?)"\s*\}',
    re.S,
)


@dataclass
class SeedReport:
    processed: int = 0
    created: int = 0
    updated: int = 0
    skipped: int = 0
    sources: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, object]:
        return {
            "processed": self.processed,
            "created": self.created,
            "updated": self.updated,
            "skipped": self.skipped,
            "sources": self.sources,
        }


def _clean_text(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _to_int(value: object) -> int:
    if value is None:
        return 0
    text = str(value).strip().replace(",", "")
    if not text:
        return 0
    try:
        return int(float(text))
    except ValueError:
        return 0


def _extract_product_id(link: str | None) -> str | None:
    if not link:
        return None
    try:
        query = parse_qs(urlparse(link).query)
    except ValueError:
        return None
    for key in ("pageKey", "itemId", "productId"):
        values = query.get(key)
        if values and values[0].strip():
            return values[0].strip()
    return None


def _canonicalize_material(row: dict[str, object], source_name: str) -> dict[str, object] | None:
    name = _clean_text(row.get("name"))
    price = _to_int(row.get("price"))
    weight_g = _to_int(row.get("weight_g") or row.get("weight"))
    if not name or price <= 0 or weight_g <= 0:
        return None

    coupang_link = _clean_text(row.get("coupang_link") or row.get("coupangLink"))
    source_keyword = _clean_text(row.get("source_keyword") or row.get("sourceKeyword"))
    product_id = _clean_text(row.get("product_id") or row.get("productId")) or _extract_product_id(
        coupang_link
    )
    return {
        "name": name,
        "price": price,
        "weight_g": weight_g,
        "coupang_link": coupang_link,
        "source_keyword": source_keyword,
        "product_id": product_id,
        "seed_sources": [source_name],
    }


def _merge_materials(
    current: dict[str, object], candidate: dict[str, object]
) -> dict[str, object]:
    merged = dict(current)
    for field_name in ("name", "price", "weight_g", "coupang_link", "source_keyword", "product_id"):
        value = candidate.get(field_name)
        if value not in (None, "", 0):
            merged[field_name] = value
    merged["seed_sources"] = merge_seed_sources(
        current.get("seed_sources"), *(candidate.get("seed_sources") or [])
    )
    return merged


def _load_json_materials(path: Path) -> list[dict[str, object]]:
    try:
        with path.open("r", encoding="utf-8") as file:
            payload = json.load(file)
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("Skipping invalid JSON seed %s: %s", path, exc)
        return []

    if isinstance(payload, dict):
        materials = payload.get("materials", [])
    elif isinstance(payload, list):
        materials = payload
    else:
        materials = []
    return [item for item in materials if isinstance(item, dict)]


def _load_csv_materials(path: Path) -> list[dict[str, object]]:
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as file:
            reader = csv.DictReader(file)
            return [dict(row) for row in reader]
    except OSError as exc:
        logger.warning("Skipping invalid CSV seed %s: %s", path, exc)
        return []


def _load_legacy_materials(path: Path) -> list[dict[str, object]]:
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        logger.warning("Skipping legacy material seed %s: %s", path, exc)
        return []

    materials: list[dict[str, object]] = []
    for match in LEGACY_MATERIAL_RE.finditer(text):
        materials.append(
            {
                "name": match.group("name").replace('\\"', '"').strip(),
                "price": match.group("price"),
                "weight": match.group("weight"),
                "coupangLink": match.group("link").replace('\\"', '"').strip(),
            }
        )
    return materials


def _iter_seed_paths() -> list[Path]:
    return [
        LEGACY_INDEX_HTML_PATH,
        SEED_DATA_DIR / "defaultMaterials.v4.js.txt",
        SEED_DATA_DIR / "coupang_baking_materials_seed.json",
        SEED_DATA_DIR / "coupang_baking_materials_seed_50.json",
        SEED_DATA_DIR / "coupang_baking_materials_seed.csv",
        SEED_DATA_DIR / "coupang_bakery_seed_120.json",
        SEED_DATA_DIR / "coupang_bakery_db_full.json",
        SEED_DATA_DIR / "coupang_bakery_db_full.csv",
    ]


def _aggregate_seed_materials() -> tuple[list[dict[str, object]], list[str]]:
    aggregated: dict[str, dict[str, object]] = {}
    sources: list[str] = []

    for path in _iter_seed_paths():
        if not path.exists():
            continue
        if path.suffix == ".json":
            raw_materials = _load_json_materials(path)
        elif path.suffix == ".csv":
            raw_materials = _load_csv_materials(path)
        else:
            raw_materials = _load_legacy_materials(path)

        if path.name not in sources:
            sources.append(path.name)

        for row in raw_materials:
            material = _canonicalize_material(row, path.name)
            if material is None:
                continue
            key = build_material_key(
                str(material["name"]),
                material.get("coupang_link"),
                material.get("product_id"),
            )
            if key in aggregated:
                aggregated[key] = _merge_materials(aggregated[key], material)
            else:
                aggregated[key] = material

    return list(aggregated.values()), sources


def seed_materials_from_sources() -> SeedReport:
    materials, sources = _aggregate_seed_materials()
    report = SeedReport(processed=len(materials), sources=sources)
    now = utcnow()

    with db_session():
        for entry in materials:
            key = build_material_key(
                str(entry["name"]),
                entry.get("coupang_link"),
                entry.get("product_id"),
            )
            existing = Material.get_or_none(Material.key == key)
            if existing is None:
                Material.create(
                    key=key,
                    name=str(entry["name"]),
                    price=int(entry["price"]),
                    weight_g=int(entry["weight_g"]),
                    coupang_link=entry.get("coupang_link"),
                    source_keyword=entry.get("source_keyword"),
                    product_id=entry.get("product_id"),
                    seed_sources=list(entry.get("seed_sources") or []),
                    is_manual=False,
                    created_at=now,
                    updated_at=now,
                )
                report.created += 1
                continue

            dirty = False
            next_sources = merge_seed_sources(existing.seed_sources, *(entry.get("seed_sources") or []))
            if next_sources != list(existing.seed_sources or []):
                existing.seed_sources = next_sources
                dirty = True

            if not existing.is_manual:
                for field_name in (
                    "name",
                    "price",
                    "weight_g",
                    "coupang_link",
                    "source_keyword",
                    "product_id",
                ):
                    next_value = entry.get(field_name)
                    if next_value in (None, "", 0):
                        continue
                    if getattr(existing, field_name) != next_value:
                        setattr(existing, field_name, next_value)
                        dirty = True

            if dirty:
                existing.updated_at = now
                existing.save()
                report.updated += 1
            else:
                report.skipped += 1

    return report
