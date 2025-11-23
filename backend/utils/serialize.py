"""Utilities to convert MongoDB/BSON types into JSON-serializable Python types.

This module provides a single `to_jsonable` helper that recursively converts
documents returned by Motor/MongoDB into primitives FastAPI/JSON can encode.

Behavior:
- Converts `ObjectId` -> string
- Converts `datetime` -> ISO 8601 string
- Renames MongoDB `_id` key to `id` with a string value
- Recurses into lists/tuples/dicts
"""
from datetime import datetime
from typing import Any

try:
    from bson import ObjectId
except Exception:  # pragma: no cover - fallback if bson isn't available in some contexts
    ObjectId = None


def _is_objectid(v: Any) -> bool:
    return ObjectId is not None and isinstance(v, ObjectId)


def to_jsonable(obj: Any) -> Any:
    """Recursively convert an object containing BSON types into JSON-able types.

    - dict -> new dict (with `_id` renamed to `id`)
    - list/tuple -> list of converted items
    - ObjectId -> str
    - datetime -> ISO string
    - other -> returned as-is
    """
    if obj is None:
        return None

    # dict -> process items and rename `_id` to `id`
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if k == "_id":
                out["id"] = to_jsonable(v)
            else:
                out[k] = to_jsonable(v)
        return out

    # list/tuple -> convert each element
    if isinstance(obj, (list, tuple)):
        return [to_jsonable(v) for v in obj]

    # ObjectId
    if _is_objectid(obj):
        return str(obj)

    # datetime -> isoformat
    if isinstance(obj, datetime):
        return obj.isoformat()

    # fallback: primitive types
    return obj
