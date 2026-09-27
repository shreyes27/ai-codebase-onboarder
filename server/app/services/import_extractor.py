import os
import re

MAX_FILE_SIZE_FOR_PARSING = 150_000  # 150 KB safety limit

JS_TS_EXTENSIONS = {".js", ".jsx", ".ts", ".tsx"}
PYTHON_EXTENSIONS = {".py"}

# --- JS / TS patterns ---
JS_IMPORT_FROM_RE = re.compile(r"""import\s+(?:[\w*{}\s,]+\s+from\s+)?['"](.+?)['"]""")
JS_REQUIRE_RE = re.compile(r"""require\(\s*['"](.+?)['"]\s*\)""")
JS_EXPORT_DEFAULT_RE = re.compile(r"""export\s+default\s+(?:function\s+|class\s+)?(\w+)?""")
JS_EXPORT_NAMED_RE = re.compile(r"""export\s+(?:const|function|class|let|var)\s+(\w+)""")
JS_EXPORT_LIST_RE = re.compile(r"""export\s*{\s*([^}]+)\s*}""")

# --- Python patterns ---
PY_IMPORT_RE = re.compile(r"""^\s*import\s+([\w\.]+)""", re.MULTILINE)
PY_FROM_IMPORT_RE = re.compile(r"""^\s*from\s+([\w\.]+)\s+import""", re.MULTILINE)
PY_DEF_RE = re.compile(r"""^\s*def\s+(\w+)\s*\(""", re.MULTILINE)
PY_CLASS_RE = re.compile(r"""^\s*class\s+(\w+)\s*[:\(]""", re.MULTILINE)


def _read_for_parsing(file_path: str):
    try:
        if os.path.getsize(file_path) > MAX_FILE_SIZE_FOR_PARSING:
            return None
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception:
        return None


def _extract_js_ts(content: str):
    imports = set()
    exports = set()

    for match in JS_IMPORT_FROM_RE.finditer(content):
        imports.add(match.group(1))

    for match in JS_REQUIRE_RE.finditer(content):
        imports.add(match.group(1))

    for match in JS_EXPORT_DEFAULT_RE.finditer(content):
        name = match.group(1)
        exports.add(name if name else "default")

    for match in JS_EXPORT_NAMED_RE.finditer(content):
        exports.add(match.group(1))

    for match in JS_EXPORT_LIST_RE.finditer(content):
        names = match.group(1).split(",")
        for name in names:
            cleaned = name.strip().split(" as ")[0].strip()
            if cleaned:
                exports.add(cleaned)

    return sorted(imports), sorted(exports)


def _extract_python(content: str):
    imports = set()
    exports = set()

    for match in PY_IMPORT_RE.finditer(content):
        imports.add(match.group(1))

    for match in PY_FROM_IMPORT_RE.finditer(content):
        imports.add(match.group(1))

    for match in PY_DEF_RE.finditer(content):
        exports.add(match.group(1))

    for match in PY_CLASS_RE.finditer(content):
        exports.add(match.group(1))

    return sorted(imports), sorted(exports)


def extract_imports_exports(repo_path: str, relative_path: str):
    file_path = os.path.join(repo_path, relative_path)
    extension = os.path.splitext(relative_path)[1].lower()

    content = _read_for_parsing(file_path)

    if content is None:
        return {"imports": [], "exports": []}

    if extension in JS_TS_EXTENSIONS:
        imports, exports = _extract_js_ts(content)
    elif extension in PYTHON_EXTENSIONS:
        imports, exports = _extract_python(content)
    else:
        imports, exports = [], []

    return {"imports": imports, "exports": exports}