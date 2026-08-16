#!/usr/bin/env python3
"""
Best-effort PDF bootstrap for the industrial company Directus project.

Typical flow:
1. Dry run and inspect extracted JSON
2. Optionally edit the JSON
3. Apply the structured payload into Directus
"""

from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import os
import re
import sys
import unicodedata
import zlib
from pathlib import Path
from typing import Any
from urllib.parse import urlencode

import requests


ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"

DEFAULT_STATUS = "published"
DOWNLOAD_FOLDER = "下载资料"

SECTION_HINTS = {
    "about": [
        "about us",
        "company profile",
        "company introduction",
        "about",
        "公司简介",
        "关于我们",
        "企业简介",
        "公司介绍",
    ],
    "products": [
        "products",
        "product",
        "product range",
        "main products",
        "our products",
        "产品",
        "产品中心",
        "主营产品",
        "产品系列",
    ],
    "industries": [
        "application",
        "applications",
        "industry",
        "industries",
        "应用",
        "应用行业",
        "行业应用",
        "适用行业",
    ],
    "certifications": [
        "certificate",
        "certificates",
        "certification",
        "certifications",
        "认证",
        "资质",
        "证书",
    ],
    "contact": [
        "contact",
        "contact us",
        "联系我们",
        "联系方式",
        "联络方式",
    ],
}

PRODUCT_KEYWORDS = [
    "machine",
    "machinery",
    "equipment",
    "valve",
    "pipe",
    "piping",
    "fitting",
    "flange",
    "pump",
    "motor",
    "gearbox",
    "bearing",
    "compressor",
    "filter",
    "sensor",
    "hydraulic",
    "cylinder",
    "actuator",
    "conveyor",
    "casting",
    "forging",
    "mold",
    "spare part",
    "component",
    "零件",
    "配件",
    "机械",
    "设备",
    "阀",
    "管",
    "管件",
    "法兰",
    "泵",
    "电机",
    "减速机",
    "轴承",
    "液压",
    "传感器",
    "压缩机",
    "过滤器",
    "铸件",
    "锻件",
    "模具",
]

INDUSTRY_MAP = {
    "water treatment": ("水处理", "Water Treatment"),
    "construction": ("建筑工程", "Construction"),
    "oil and gas": ("石油天然气", "Oil and Gas"),
    "oil & gas": ("石油天然气", "Oil and Gas"),
    "chemical": ("化工", "Chemical"),
    "mining": ("矿业", "Mining"),
    "food": ("食品", "Food"),
    "pharmaceutical": ("制药", "Pharmaceutical"),
    "power": ("电力", "Power"),
    "marine": ("船舶", "Marine"),
    "automotive": ("汽车制造", "Automotive"),
    "hvac": ("暖通空调", "HVAC"),
    "制造": ("工业制造", "Manufacturing"),
    "水处理": ("水处理", "Water Treatment"),
    "建筑": ("建筑工程", "Construction"),
    "化工": ("化工", "Chemical"),
    "矿业": ("矿业", "Mining"),
    "食品": ("食品", "Food"),
    "制药": ("制药", "Pharmaceutical"),
    "电力": ("电力", "Power"),
    "船舶": ("船舶", "Marine"),
    "汽车": ("汽车制造", "Automotive"),
}

CERTIFICATION_PATTERNS = [
    (re.compile(r"\bISO\s*9001\b", re.I), ("ISO 9001 质量认证", "ISO 9001 Certification", "ISO 9001")),
    (re.compile(r"\bISO\s*14001\b", re.I), ("ISO 14001 环境认证", "ISO 14001 Certification", "ISO 14001")),
    (re.compile(r"\bISO\s*45001\b", re.I), ("ISO 45001 职业健康安全认证", "ISO 45001 Certification", "ISO 45001")),
    (re.compile(r"\bCE\b", re.I), ("CE 认证", "CE Certificate", "CE")),
    (re.compile(r"\bRoHS\b", re.I), ("RoHS 认证", "RoHS Certificate", "RoHS")),
    (re.compile(r"\bSGS\b", re.I), ("SGS 检测", "SGS Verification", "SGS")),
    (re.compile(r"\bTUV\b", re.I), ("TUV 认证", "TUV Certificate", "TUV")),
    (re.compile(r"\bUL\b", re.I), ("UL 认证", "UL Certificate", "UL")),
    (re.compile(r"\bFDA\b", re.I), ("FDA 认证", "FDA Certificate", "FDA")),
    (re.compile(r"\bAPI\b", re.I), ("API 认证", "API Certificate", "API")),
    (re.compile(r"\bPED\b", re.I), ("PED 认证", "PED Certificate", "PED")),
    (re.compile(r"ISO9001", re.I), ("ISO 9001 质量认证", "ISO 9001 Certification", "ISO 9001")),
]


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            env[key.strip()] = value.strip()
    return env


ENV = load_env()
BASE_URL = os.environ.get("DIRECTUS_URL", ENV.get("DIRECTUS_URL", "http://127.0.0.1:8055")).rstrip("/")
TOKEN = os.environ.get("DIRECTUS_ADMIN_TOKEN") or os.environ.get("ADMIN_TOKEN") or ENV.get("ADMIN_TOKEN", "")


def api_request(method: str, path: str, *, params: dict[str, Any] | None = None, json_payload: dict[str, Any] | None = None, data: dict[str, Any] | None = None, files: dict[str, Any] | None = None) -> Any:
    headers: dict[str, str] = {}
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    if json_payload is not None:
        headers["Content-Type"] = "application/json"
    response = requests.request(
        method,
        f"{BASE_URL}{path}",
        params=params,
        headers=headers,
        json=json_payload,
        data=data,
        files=files,
        timeout=120,
    )
    if not response.ok:
        raise RuntimeError(f"{method} {path} failed: {response.status_code} {response.text}")
    if not response.text:
        return None
    return response.json()


def sanitize_payload(payload: dict[str, Any]) -> dict[str, Any]:
    cleaned: dict[str, Any] = {}
    for key, value in payload.items():
        if value is None:
            continue
        if isinstance(value, str) and not value.strip():
            continue
        cleaned[key] = value
    return cleaned


def query_items(collection: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    response = api_request("GET", f"/items/{collection}", params=params)
    return response.get("data", []) if isinstance(response, dict) else []


def find_one(collection: str, field: str, value: str) -> dict[str, Any] | None:
    params = {f"filter[{field}][_eq]": value, "limit": 1}
    items = query_items(collection, params=params)
    return items[0] if items else None


def patch_item(collection: str, item_id: Any, payload: dict[str, Any]) -> dict[str, Any] | None:
    payload = sanitize_payload(payload)
    if not payload:
        return None
    response = api_request("PATCH", f"/items/{collection}/{item_id}", json_payload=payload)
    return response.get("data") if isinstance(response, dict) else None


def create_item(collection: str, payload: dict[str, Any]) -> dict[str, Any]:
    response = api_request("POST", f"/items/{collection}", json_payload=sanitize_payload(payload))
    return response.get("data") if isinstance(response, dict) else response


def upsert_item(collection: str, payload: dict[str, Any], unique_field: str) -> dict[str, Any] | None:
    payload = sanitize_payload(payload)
    unique_value = payload.get(unique_field)
    if not unique_value:
        raise ValueError(f"Missing unique field {unique_field} for {collection}")
    existing = find_one(collection, unique_field, str(unique_value))
    if existing:
        patch_item(collection, existing["id"], payload)
        return existing
    return create_item(collection, payload)


def patch_site_settings(payload: dict[str, Any]) -> None:
    payload = sanitize_payload(payload)
    if payload:
        api_request("PATCH", "/items/site_settings", json_payload=payload)


def ensure_folder(name: str) -> str | None:
    response = api_request("GET", "/folders")
    folders = response.get("data", []) if isinstance(response, dict) else []
    for item in folders:
        if item.get("name") == name:
            return item.get("id")
    created = api_request("POST", "/folders", json_payload={"name": name})
    return created.get("data", {}).get("id") if isinstance(created, dict) else None


def upload_file(file_path: Path, *, title: str, folder_name: str) -> str | None:
    folder_id = ensure_folder(folder_name)
    content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
    with file_path.open("rb") as fh:
        response = api_request(
            "POST",
            "/files",
            data={"title": title, **({"folder": folder_id} if folder_id else {})},
            files={"file": (file_path.name, fh, content_type)},
        )
    return response.get("data", {}).get("id") if isinstance(response, dict) else None


def normalize_whitespace(value: str) -> str:
    value = value.replace("\u3000", " ")
    value = value.replace("\x00", "")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def clean_line(line: str) -> str:
    line = normalize_whitespace(line)
    line = re.sub(r"^[\-\u2022\u00b7\*\u25cf]+\s*", "", line)
    return line.strip()


def decode_literal_string(raw: str) -> bytes:
    data = bytearray()
    i = 0
    while i < len(raw):
        ch = raw[i]
        if ch != "\\":
            data.append(ord(ch))
            i += 1
            continue
        i += 1
        if i >= len(raw):
            break
        esc = raw[i]
        if esc in "nrtbf":
            data.extend({
                "n": b"\n",
                "r": b"\r",
                "t": b"\t",
                "b": b"\b",
                "f": b"\f",
            }[esc])
        elif esc in "\\()":
            data.append(ord(esc))
        elif esc in "\n\r":
            if esc == "\r" and i + 1 < len(raw) and raw[i + 1] == "\n":
                i += 1
        elif esc.isdigit():
            digits = esc
            for _ in range(2):
                if i + 1 < len(raw) and raw[i + 1].isdigit():
                    i += 1
                    digits += raw[i]
                else:
                    break
            data.append(int(digits, 8))
        else:
            data.append(ord(esc))
        i += 1
    return bytes(data)


def decode_pdf_bytes(raw: bytes) -> str:
    raw = raw.strip()
    if not raw:
        return ""
    if raw.startswith(b"\xfe\xff") or raw.startswith(b"\xff\xfe"):
        for encoding in ("utf-16", "utf-16-be", "utf-16-le"):
            try:
                return raw.decode(encoding).replace("\x00", "").strip()
            except UnicodeDecodeError:
                continue
    if b"\x00" in raw:
        try:
            return raw.decode("utf-16-be").replace("\x00", "").strip()
        except UnicodeDecodeError:
            pass
    for encoding in ("utf-8", "latin-1"):
        try:
            return raw.decode(encoding).strip()
        except UnicodeDecodeError:
            continue
    return raw.decode("latin-1", errors="ignore").strip()


def decode_hex_string(raw: str) -> str:
    cleaned = re.sub(r"\s+", "", raw)
    if len(cleaned) % 2 == 1:
        cleaned += "0"
    try:
        data = bytes.fromhex(cleaned)
    except ValueError:
        return ""
    return decode_pdf_bytes(data)


def extract_strings_from_array(array_body: str) -> list[str]:
    results: list[str] = []
    pattern = re.compile(r"\((?:\\.|[^\\()])*\)|<[^>]+>")
    for match in pattern.finditer(array_body):
        token = match.group(0)
        if token.startswith("("):
            results.append(decode_pdf_bytes(decode_literal_string(token[1:-1])))
        elif token.startswith("<"):
            results.append(decode_hex_string(token[1:-1]))
    return [item for item in results if item]


def apply_stream_filters(stream: bytes, dict_text: bytes) -> bytes:
    filters: list[str] = []
    if b"/FlateDecode" in dict_text:
        filters.append("flate")
    if b"/ASCII85Decode" in dict_text:
        filters.append("ascii85")
    decoded = stream
    for filter_name in filters:
        try:
            if filter_name == "ascii85":
                decoded = base64.a85decode(decoded, adobe=True)
            elif filter_name == "flate":
                decoded = zlib.decompress(decoded)
        except Exception:
            return b""
    return decoded


def extract_stream_text(stream_bytes: bytes) -> list[str]:
    try:
        stream_text = stream_bytes.decode("latin-1", errors="ignore")
    except Exception:
        return []
    chunks: list[str] = []
    for match in re.finditer(r"\((?:\\.|[^\\()])*\)\s*Tj", stream_text):
        token = match.group(0)
        literal = token[: token.rfind(")")]
        chunks.append(decode_pdf_bytes(decode_literal_string(literal[1:])))
    for match in re.finditer(r"<([0-9A-Fa-f\s]+)>\s*Tj", stream_text):
        chunks.append(decode_hex_string(match.group(1)))
    for match in re.finditer(r"\[(.*?)\]\s*TJ", stream_text, re.S):
        chunks.extend(extract_strings_from_array(match.group(1)))
    return [item for item in chunks if item and not item.isspace()]


def extract_pdf_text(pdf_path: Path) -> tuple[str, list[str]]:
    data = pdf_path.read_bytes()
    chunks: list[str] = []
    stream_pattern = re.compile(rb"<<(.*?)>>\s*stream\r?\n", re.S)
    for match in stream_pattern.finditer(data):
        dict_text = match.group(1)
        stream_start = match.end()
        stream_end = data.find(b"endstream", stream_start)
        if stream_end == -1:
            continue
        stream = data[stream_start:stream_end].strip(b"\r\n")
        decoded = apply_stream_filters(stream, dict_text)
        if not decoded:
            continue
        chunks.extend(extract_stream_text(decoded))
    if not chunks:
        # Fallback for simple text-based PDFs with readable strings.
        for match in re.finditer(rb"[A-Za-z0-9@\.\-_/+():,& ]{4,}", data):
            text = decode_pdf_bytes(match.group(0))
            if text:
                chunks.append(text)
    lines = [clean_line(part) for part in "\n".join(chunks).splitlines()]
    lines = [line for line in lines if line]
    lines = remove_repeated_noise(lines)
    return "\n".join(lines), lines


def remove_repeated_noise(lines: list[str]) -> list[str]:
    counts: dict[str, int] = {}
    for line in lines:
        counts[line] = counts.get(line, 0) + 1
    cleaned: list[str] = []
    for line in lines:
        if counts.get(line, 0) > 4 and len(line) < 40:
            continue
        if re.fullmatch(r"\d+", line):
            continue
        cleaned.append(line)
    return cleaned


def looks_chinese(text: str) -> bool:
    return sum(1 for ch in text if "\u4e00" <= ch <= "\u9fff") >= max(2, len(text) // 6)


def slugify(text: str, fallback: str = "item") -> str:
    ascii_text = unicodedata.normalize("NFKD", text)
    ascii_text = ascii_text.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_text).strip("-").lower()
    return slug or fallback


def score_company_line(line: str, index: int) -> int:
    lowered = line.lower()
    score = 0
    if len(line) < 3 or len(line) > 80:
        return -10
    if index < 12:
        score += 3
    if any(token in lowered for token in ("company", "co.,", "co ", "ltd", "limited", "industrial", "machinery", "technology")):
        score += 6
    if any(token in line for token in ("公司", "机械", "科技", "工业", "制造", "有限")):
        score += 6
    if any(token in lowered for token in ("www", "http", "@", "tel", "phone", "fax")):
        score -= 4
    if re.search(r"\d{4,}", line):
        score -= 2
    return score


def derive_company_names(lines: list[str], pdf_path: Path) -> tuple[str | None, str | None]:
    candidates = sorted(
        ((score_company_line(line, idx), line) for idx, line in enumerate(lines[:30])),
        reverse=True,
    )
    chosen = [line for score, line in candidates if score >= 6]
    name_zh = next((line for line in chosen if looks_chinese(line)), None)
    name_en = next((line for line in chosen if not looks_chinese(line)), None)
    stem = pdf_path.stem.replace("_", " ").replace("-", " ").strip()
    if not name_zh and looks_chinese(stem):
        name_zh = stem
    if not name_en and not looks_chinese(stem):
        name_en = stem.title()
    return name_zh, name_en


def extract_contact_info(lines: list[str], text: str) -> dict[str, str]:
    contact: dict[str, str] = {}
    emails = sorted(set(re.findall(r"[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}", text, re.I)))
    phones = sorted(set(match.strip() for match in re.findall(r"(?:\+?\d[\d()\-\s]{6,}\d)", text)))
    websites = sorted(set(re.findall(r"(?:https?://|www\.)[^\s)]+", text, re.I)))
    if emails:
        contact["email"] = emails[0]
    if phones:
        contact["phone"] = phones[0]
    if len(phones) > 1:
        contact["whatsapp"] = phones[1]
    elif phones:
        contact["whatsapp"] = phones[0]
    if websites:
        contact["website"] = websites[0]
    for line in lines:
        lowered = line.lower()
        if "wechat" in lowered or "微信" in line:
            value = re.split(r"[:：]", line, maxsplit=1)
            if len(value) == 2 and value[1].strip():
                contact["wechat"] = value[1].strip()
        if any(token in lowered for token in ("address", "factory address")) or "地址" in line:
            value = re.split(r"[:：]", line, maxsplit=1)
            address = value[1].strip() if len(value) == 2 else line
            if looks_chinese(address):
                contact.setdefault("address_zh", address)
            else:
                contact.setdefault("address_en", address)
    return contact


def detect_section_positions(lines: list[str]) -> list[tuple[int, str]]:
    positions: list[tuple[int, str]] = []
    for idx, line in enumerate(lines):
        lowered = line.lower()
        if len(line) > 48:
            continue
        for section, hints in SECTION_HINTS.items():
            if any(hint in lowered or hint in line for hint in hints):
                positions.append((idx, section))
                break
    deduped: list[tuple[int, str]] = []
    seen: set[tuple[int, str]] = set()
    for item in positions:
        if item not in seen:
            seen.add(item)
            deduped.append(item)
    return deduped


def split_sections(lines: list[str]) -> dict[str, str]:
    positions = detect_section_positions(lines)
    if not positions:
        about = "\n".join(lines[:80]).strip()
        return {"about": about}
    positions.sort()
    sections: dict[str, str] = {}
    for idx, (start, section) in enumerate(positions):
        end = positions[idx + 1][0] if idx + 1 < len(positions) else len(lines)
        body = "\n".join(lines[start + 1 : end]).strip()
        if body:
            sections[section] = body
    if "about" not in sections:
        first_start = positions[0][0]
        sections["about"] = "\n".join(lines[:first_start]).strip() or "\n".join(lines[:80]).strip()
    return sections


def section_excerpt(section_text: str, fallback_text: str, *, max_chars: int = 220) -> str:
    source = section_text or fallback_text
    source = normalize_whitespace(source)
    if not source:
        return ""
    return source[:max_chars].rstrip(" ,;:") + ("..." if len(source) > max_chars else "")


def dedupe_preserve(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        key = normalize_whitespace(item).lower()
        if not key or key in seen:
            continue
        seen.add(key)
        result.append(normalize_whitespace(item))
    return result


def extract_industries(section_text: str, full_text: str) -> list[dict[str, Any]]:
    haystack = f"{section_text}\n{full_text}".lower()
    results: list[dict[str, Any]] = []
    for keyword, (zh_name, en_name) in INDUSTRY_MAP.items():
        if keyword.lower() in haystack:
            results.append(
                {
                    "name_zh": zh_name,
                    "name_en": en_name,
                    "summary_zh": f"从公司 PDF 中识别的行业方向：{zh_name}",
                    "summary_en": f"Industry direction extracted from the company PDF: {en_name}",
                }
            )
    return dedupe_structured(results, key="name_en")


def extract_certifications(text: str) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for pattern, (title_zh, title_en, cert_type) in CERTIFICATION_PATTERNS:
        if pattern.search(text):
            results.append(
                {
                    "title_zh": title_zh,
                    "title_en": title_en,
                    "description_zh": "从公司 PDF 中识别出的资质信息。",
                    "description_en": "Certification extracted from the company PDF.",
                    "certificate_type": cert_type,
                }
            )
    return dedupe_structured(results, key="title_en")


def is_product_line(line: str) -> bool:
    lowered = line.lower()
    if len(line) < 2 or len(line) > 70:
        return False
    if any(token in lowered for token in ("phone", "email", "address", "www", "http")):
        return False
    if re.search(r"^[A-Z0-9\-_/ ]+$", line) and len(line.split()) <= 2:
        return False
    return any(keyword in lowered or keyword in line for keyword in PRODUCT_KEYWORDS)


def extract_product_names(sections: dict[str, str], lines: list[str]) -> list[str]:
    sources = []
    if sections.get("products"):
        sources.extend(sections["products"].splitlines())
    else:
        sources.extend(lines)
    candidates: list[str] = []
    for line in sources:
        line = clean_line(line)
        if not is_product_line(line):
            continue
        if any(separator in line for separator in (" / ", " | ", "、", ",")) and len(line) > 18:
            pieces = re.split(r"\s*/\s*|\s*\|\s*|、|,", line)
            candidates.extend(piece.strip() for piece in pieces if is_product_line(piece.strip()))
        else:
            candidates.append(line)
    return dedupe_preserve(candidates)[:12]


def build_product_payloads(names: list[str], sections: dict[str, str], status: str) -> list[dict[str, Any]]:
    description_zh = section_excerpt(sections.get("products", ""), sections.get("about", ""), max_chars=800)
    description_en = description_zh
    payloads: list[dict[str, Any]] = []
    for index, name in enumerate(names, start=1):
        zh_name = name if looks_chinese(name) else None
        en_name = name if not looks_chinese(name) else None
        slug_seed = en_name or zh_name or f"product-{index}"
        summary = f"从公司 PDF 自动提取的产品条目：{name}"
        payloads.append(
            {
                "product_code": f"pdf-{index:03d}",
                "name_zh": zh_name or name,
                "name_en": en_name or name,
                "summary_zh": summary,
                "summary_en": summary,
                "description_zh": description_zh,
                "description_en": description_en,
                "slug_zh": slugify(slug_seed, fallback=f"product-{index}"),
                "slug_en": slugify(slug_seed, fallback=f"product-{index}"),
                "status": status,
                "sort_order": index,
            }
        )
    return payloads


def dedupe_structured(items: list[dict[str, Any]], *, key: str) -> list[dict[str, Any]]:
    seen: set[str] = set()
    result: list[dict[str, Any]] = []
    for item in items:
        value = normalize_whitespace(str(item.get(key, ""))).lower()
        if not value or value in seen:
            continue
        seen.add(value)
        result.append(item)
    return result


def confidence_report(text: str) -> dict[str, Any]:
    stripped = re.sub(r"\s+", "", text)
    cjk = sum(1 for ch in stripped if "\u4e00" <= ch <= "\u9fff")
    latin = sum(1 for ch in stripped if ch.isalpha() and ch.isascii())
    printable = sum(1 for ch in stripped if ch.isprintable())
    ratio = round(printable / len(stripped), 3) if stripped else 0
    level = "low"
    if len(stripped) >= 300 and ratio >= 0.9 and (cjk + latin) >= 100:
        level = "medium"
    if len(stripped) >= 900 and ratio >= 0.95 and (cjk + latin) >= 300:
        level = "high"
    return {
        "level": level,
        "characters": len(stripped),
        "cjk_characters": cjk,
        "latin_characters": latin,
        "printable_ratio": ratio,
    }


def build_payload_from_pdf(pdf_path: Path, *, status: str) -> dict[str, Any]:
    raw_text, lines = extract_pdf_text(pdf_path)
    sections = split_sections(lines)
    contact = extract_contact_info(lines, raw_text)
    company_name_zh, company_name_en = derive_company_names(lines, pdf_path)
    industries = extract_industries(sections.get("industries", ""), raw_text)
    certifications = extract_certifications(raw_text)
    product_names = extract_product_names(sections, lines)
    products = build_product_payloads(product_names, sections, status)

    about_excerpt = section_excerpt(sections.get("about", ""), raw_text)
    company_zh = company_name_zh or company_name_en or pdf_path.stem
    company_en = company_name_en or company_name_zh or pdf_path.stem
    profile_title_zh = f"{company_zh} 公司资料"
    profile_title_en = f"{company_en} Company Profile"

    site_settings = sanitize_payload(
        {
            "site_name_zh": f"{company_zh}官网",
            "site_name_en": f"{company_en} Official Website",
            "company_name_zh": company_name_zh or company_name_en,
            "company_name_en": company_name_en or company_name_zh,
            "email": contact.get("email"),
            "phone": contact.get("phone"),
            "whatsapp": contact.get("whatsapp"),
            "wechat": contact.get("wechat"),
            "address_zh": contact.get("address_zh"),
            "address_en": contact.get("address_en"),
            "default_seo_title_zh": company_name_zh or company_en,
            "default_seo_title_en": company_name_en or company_zh,
            "default_seo_description_zh": about_excerpt,
            "default_seo_description_en": about_excerpt,
        }
    )

    contact_body = sections.get("contact", "")
    contact_lines = []
    if contact.get("email"):
        contact_lines.append(f"邮箱 / Email: {contact['email']}")
    if contact.get("phone"):
        contact_lines.append(f"电话 / Phone: {contact['phone']}")
    if contact.get("whatsapp"):
        contact_lines.append(f"WhatsApp: {contact['whatsapp']}")
    if contact.get("wechat"):
        contact_lines.append(f"WeChat: {contact['wechat']}")
    if contact.get("website"):
        contact_lines.append(f"Website: {contact['website']}")
    if contact.get("address_zh"):
        contact_lines.append(f"地址: {contact['address_zh']}")
    if contact.get("address_en"):
        contact_lines.append(f"Address: {contact['address_en']}")
    if contact_body:
        contact_lines.append(contact_body)

    pages = [
        {
            "page_key": "home",
            "title_zh": company_zh,
            "title_en": company_en,
            "subtitle_zh": about_excerpt,
            "subtitle_en": about_excerpt,
            "content_zh": normalize_whitespace(sections.get("about", raw_text[:2000])),
            "content_en": normalize_whitespace(sections.get("about", raw_text[:2000])),
            "slug_zh": "home",
            "slug_en": "home",
            "seo_title_zh": company_zh,
            "seo_title_en": company_en,
            "seo_description_zh": about_excerpt,
            "seo_description_en": about_excerpt,
            "status": status,
        },
        {
            "page_key": "about",
            "title_zh": "关于我们",
            "title_en": "About Us",
            "subtitle_zh": company_zh,
            "subtitle_en": company_en,
            "content_zh": normalize_whitespace(sections.get("about", raw_text[:3000])),
            "content_en": normalize_whitespace(sections.get("about", raw_text[:3000])),
            "slug_zh": "about",
            "slug_en": "about",
            "seo_title_zh": f"关于 {company_zh}",
            "seo_title_en": f"About {company_en}",
            "seo_description_zh": about_excerpt,
            "seo_description_en": about_excerpt,
            "status": status,
        },
        {
            "page_key": "contact",
            "title_zh": "联系我们",
            "title_en": "Contact Us",
            "subtitle_zh": company_zh,
            "subtitle_en": company_en,
            "content_zh": "\n".join(contact_lines),
            "content_en": "\n".join(contact_lines),
            "slug_zh": "contact",
            "slug_en": "contact",
            "seo_title_zh": f"联系 {company_zh}",
            "seo_title_en": f"Contact {company_en}",
            "seo_description_zh": "公司联系方式与沟通入口。",
            "seo_description_en": "Company contact details and communication channels.",
            "status": status,
        },
        {
            "page_key": "downloads",
            "title_zh": "下载中心",
            "title_en": "Downloads",
            "subtitle_zh": profile_title_zh,
            "subtitle_en": profile_title_en,
            "content_zh": "这里展示从公司 PDF 自动导入的资料文件。",
            "content_en": "This page lists materials imported from the company PDF.",
            "slug_zh": "downloads",
            "slug_en": "downloads",
            "seo_title_zh": "下载中心",
            "seo_title_en": "Downloads",
            "seo_description_zh": "公司资料下载入口。",
            "seo_description_en": "Company materials and downloads.",
            "status": status,
        },
    ]

    downloads = [
        {
            "title_zh": profile_title_zh,
            "title_en": profile_title_en,
            "description_zh": "公司 PDF 原件，供访客下载查看。",
            "description_en": "Original company PDF uploaded for visitors to download.",
            "file_type": "PDF",
            "download_category": "company-profile",
            "status": status,
            "sort_order": 1,
        }
    ]

    return {
        "source": {
            "pdf_path": str(pdf_path),
            "pdf_name": pdf_path.name,
        },
        "confidence": confidence_report(raw_text),
        "site_settings": site_settings,
        "pages": [sanitize_payload(page) for page in pages],
        "downloads": downloads,
        "certifications": [sanitize_payload(item) for item in certifications],
        "industries": [sanitize_payload({**item, "slug_zh": slugify(item["name_en"]), "slug_en": slugify(item["name_en"]), "status": status}) for item in industries],
        "products": [sanitize_payload(item) for item in products],
        "contact": contact,
        "sections": sections,
        "raw_text_preview": raw_text[:5000],
        "raw_line_count": len(lines),
    }


def summarize_payload(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "source": payload["source"],
        "confidence": payload["confidence"],
        "site_settings_keys": sorted(payload.get("site_settings", {}).keys()),
        "pages": [page.get("page_key") for page in payload.get("pages", [])],
        "downloads": len(payload.get("downloads", [])),
        "certifications": len(payload.get("certifications", [])),
        "industries": len(payload.get("industries", [])),
        "products": len(payload.get("products", [])),
    }


def apply_payload(payload: dict[str, Any], *, pdf_path: Path | None, status: str) -> dict[str, Any]:
    results: dict[str, Any] = {"uploaded_file_id": None, "downloads": [], "certifications": [], "industries": [], "products": [], "pages": []}

    if payload.get("site_settings"):
        patch_site_settings(payload["site_settings"])

    uploaded_file_id = None
    if pdf_path and pdf_path.exists():
        title = payload.get("downloads", [{}])[0].get("title_zh") or pdf_path.stem
        uploaded_file_id = upload_file(pdf_path, title=title, folder_name=DOWNLOAD_FOLDER)
        results["uploaded_file_id"] = uploaded_file_id

    for page in payload.get("pages", []):
        upsert_item("pages", {**page, "status": page.get("status") or status}, "page_key")
        results["pages"].append(page.get("page_key"))

    for index, industry in enumerate(payload.get("industries", []), start=1):
        record = {**industry, "sort_order": industry.get("sort_order", index), "status": industry.get("status") or status}
        unique_field = "slug_en" if record.get("slug_en") else "name_en"
        upsert_item("industries", record, unique_field)
        results["industries"].append(record.get(unique_field))

    for index, product in enumerate(payload.get("products", []), start=1):
        record = {**product, "sort_order": product.get("sort_order", index), "status": product.get("status") or status}
        unique_field = "slug_en" if record.get("slug_en") else "product_code"
        upsert_item("products", record, unique_field)
        results["products"].append(record.get(unique_field))

    for index, cert in enumerate(payload.get("certifications", []), start=1):
        record = {**cert, "sort_order": cert.get("sort_order", index), "status": cert.get("status") or status}
        unique_field = "title_en" if record.get("title_en") else "title_zh"
        upsert_item("certifications", record, unique_field)
        results["certifications"].append(record.get(unique_field))

    for index, download in enumerate(payload.get("downloads", []), start=1):
        record = {
            **download,
            "sort_order": download.get("sort_order", index),
            "status": download.get("status") or status,
        }
        if uploaded_file_id:
            record["file"] = uploaded_file_id
        unique_field = "title_en" if record.get("title_en") else "title_zh"
        upsert_item("downloads", record, unique_field)
        results["downloads"].append(record.get(unique_field))

    return results


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Parse a company PDF and bootstrap Directus content.")
    parser.add_argument("--pdf", type=Path, help="Path to the company PDF.")
    parser.add_argument("--json-in", type=Path, help="Optional edited JSON payload generated by a previous dry run.")
    parser.add_argument("--json-out", type=Path, help="Where to save the structured payload.")
    parser.add_argument("--apply", action="store_true", help="Write the structured payload into Directus.")
    parser.add_argument("--force", action="store_true", help="Allow apply even when extraction confidence is low.")
    parser.add_argument("--status", default=DEFAULT_STATUS, choices=["published", "draft"], help="Status for imported records.")
    return parser.parse_args()


def load_payload_from_json(json_path: Path) -> dict[str, Any]:
    with json_path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def main() -> int:
    args = parse_args()
    if not args.pdf and not args.json_in:
        print("error: provide --pdf or --json-in", file=sys.stderr)
        return 2

    if args.json_in:
        payload = load_payload_from_json(args.json_in)
        pdf_path = args.pdf or Path(payload.get("source", {}).get("pdf_path", "")) if payload.get("source") else args.pdf
    else:
        if not args.pdf or not args.pdf.exists():
            print(f"error: PDF not found: {args.pdf}", file=sys.stderr)
            return 2
        payload = build_payload_from_pdf(args.pdf, status=args.status)
        pdf_path = args.pdf

    if args.json_out:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        with args.json_out.open("w", encoding="utf-8") as fh:
            json.dump(payload, fh, ensure_ascii=False, indent=2)

    print(json.dumps(summarize_payload(payload), ensure_ascii=False, indent=2))

    confidence = payload.get("confidence", {})
    if args.apply:
        if confidence.get("level") == "low" and not args.force and not args.json_in:
            print("error: extraction confidence is low; review the JSON first or rerun with --force", file=sys.stderr)
            return 1
        if not TOKEN:
            print("error: Directus admin token not found in env", file=sys.stderr)
            return 1
        results = apply_payload(payload, pdf_path=pdf_path if isinstance(pdf_path, Path) else None, status=args.status)
        print(json.dumps({"applied": True, "results": results}, ensure_ascii=False, indent=2))
    else:
        print("dry-run only; add --apply to write into Directus", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
