#!/usr/bin/env python3
import json
from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parents[1] / "htdocs" / "hotelwifi"
i18n = root / "i18n"
base = json.loads((i18n / "en.json").read_text(encoding="utf-8"))
base_keys = set(base)
errors = []

placeholder = re.compile(r"\{([^}]+)\}")

for path in sorted(i18n.glob("*.json")):
    data = json.loads(path.read_text(encoding="utf-8"))
    extra = set(data) - base_keys
    if extra:
        errors.append(f"{path.name}: unknown keys: {sorted(extra)}")
    for key, value in data.items():
        expected = set(placeholder.findall(base[key]))
        actual = set(placeholder.findall(value))
        if expected != actual:
            errors.append(
                f"{path.name}: placeholder mismatch for {key}: "
                f"expected {sorted(expected)}, got {sorted(actual)}"
            )

if errors:
    print("\n".join(errors))
    sys.exit(1)

print(f"OK: {len(list(i18n.glob('*.json')))} catalogues, {len(base_keys)} base keys")
