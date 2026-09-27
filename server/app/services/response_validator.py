# response validator
import re


FRAMEWORK_TECH_DENYLIST = {
    "express.js",
    "express",
    "react",
    "react.js",
    "redux",
    "node.js",
    "nodejs",
    "javascript",
    "typescript",
    "python",
    "vue.js",
    "vue",
    "angular",
    "angularjs",
    "next.js",
    "nextjs",
    "django",
    "flask",
    "ruby",
    "rails",
    "php",
    "laravel",
    "java",
    "golang",
    "rust",
    "jquery",
    "webpack",
    "babel",
    "eslint",
    "docker",
    "kubernetes",
    "graphql",
    "mongodb",
    "postgresql",
    "mysql",
    "redis",
    "html",
    "css",
    "sass",
    "scss",
    "bootstrap",
    "tailwind",
    "tailwindcss",
    "jest",
    "mocha",
    "chai",
    "fastapi",
    "uvicorn",
    "gitpython",
    "pytest",
}


NODE_BUILTIN_MODULES = {
    "assert",
    "async_hooks",
    "buffer",
    "child_process",
    "cluster",
    "console",
    "constants",
    "crypto",
    "dgram",
    "diagnostics_channel",
    "dns",
    "domain",
    "events",
    "fs",
    "http",
    "http2",
    "https",
    "inspector",
    "module",
    "net",
    "os",
    "path",
    "perf_hooks",
    "process",
    "punycode",
    "querystring",
    "readline",
    "repl",
    "stream",
    "string_decoder",
    "sys",
    "timers",
    "tls",
    "trace_events",
    "tty",
    "url",
    "util",
    "v8",
    "vm",
    "wasi",
    "worker_threads",
    "zlib",
}

CONFIRMED_NO_PRIMARY_ENTRY_STATEMENT = re.compile(
    r"no\s+single\s+confident\s+main\s+entry\s+point\s+was\s+identified\.?",
    re.IGNORECASE,
)


BULLET_LINE_PATTERN = re.compile(
    r"^\s*(?:[-*•]|\d+[.)])\s+(.*)$",
    re.MULTILINE,
)


FILE_PATH_PATTERN = re.compile(
    r"""
    (?<![\w.-])
    (?:
        [A-Za-z0-9_.-]+/
    )*
    [A-Za-z0-9_.-]+\.
    (?:
        js|jsx|ts|tsx|
        py|pyw|
        java|kt|kts|
        go|rs|rb|php|
        c|h|cpp|hpp|cc|cs|
        json|yaml|yml|
        html|css|scss|sass|
        vue|svelte|
        sql|sh|bash|bat|ps1
    )
    (?![\w.-])
    """,
    re.IGNORECASE | re.VERBOSE,
)

CODE_PATH_PATTERN = re.compile(
    r"`([^`\r\n]*/[^`\r\n]*)`"
)


ARROW_CHAIN_PATTERN = re.compile(
    r"""
    ([A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+)*\.[A-Za-z0-9]+)
    \s*->\s*
    ([A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+)*\.[A-Za-z0-9]+)
    """,
    re.VERBOSE,
)


FLOW_LANGUAGE_PATTERNS = [
    re.compile(
        r"\b(?:request|response|runtime|application|execution|startup)"
        r".{0,80}\b(?:flow|path|sequence|starts|passes|calls)\b",
        re.IGNORECASE | re.DOTALL,
    ),
    re.compile(
        r"\b(?:flow|sequence|request path)\b.{0,120}"
        r"\b(?:route|controller|service|handler|middleware|database|entry point)\b",
        re.IGNORECASE | re.DOTALL,
    ),
]


DEPENDENCY_SECTION_NAMES = {
    "Dependency Overview",
}


SETUP_COMMAND_PATTERN = re.compile(
    r"""
    (?:
        npm\s+(?:install|ci|start|run|test|build|dev)
        |
        yarn\s+(?:install|start|dev|build|test)
        |
        pnpm\s+(?:install|start|dev|build|test)
        |
        bun\s+(?:install|run|dev|build|test)
        |
        pip\s+install
        |
        python(?:3)?\s+[A-Za-z0-9_.-]+\.py
        |
        node\s+[A-Za-z0-9_./\\-]+
        |
        docker(?:\s+compose)?\s+(?:up|build|run)
        |
        uvicorn\s+[A-Za-z0-9_.:-]+
        |
        cargo\s+(?:run|build|test)
        |
        go\s+(?:run|build|test)
    )
    """,
    re.IGNORECASE | re.VERBOSE,
)


def _looks_like_real_path_candidate(candidate: str) -> bool:
    candidate = candidate.strip()

    # Directory references are not file-path claims.
    if candidate.endswith("/"):
        return False

    # Directory globs are not individual repository file paths.
    if candidate.endswith("/*"):
        return False

    # Relative import/module references are not repository path claims.
    if candidate.startswith("./") or candidate.startswith("../"):
        return False

    return candidate.lower() not in FRAMEWORK_TECH_DENYLIST


def _locate_sections(guide_text: str, section_names: list) -> dict:
    positions = {}

    for section in section_names:
        pattern = re.compile(
            rf"^\s*(?:#+\s*)?{re.escape(section)}\s*$",
            re.IGNORECASE | re.MULTILINE,
        )

        match = pattern.search(guide_text)

        if match:
            positions[section] = match.start()

    return positions


def _section_for_index(index: int, section_positions: dict) -> str:
    matching = [
        (position, section)
        for section, position in section_positions.items()
        if position <= index
    ]

    if not matching:
        return "Unknown"

    return max(matching, key=lambda item: item[0])[1]


def _section_text(
    guide_text: str,
    section_name: str,
    section_positions: dict,
    section_names: list,
) -> str:
    if section_name not in section_positions:
        return ""

    start = section_positions[section_name]

    later_positions = [
        position
        for section, position in section_positions.items()
        if position > start
    ]

    end = min(later_positions) if later_positions else len(guide_text)

    return guide_text[start:end]


def _normalize_path(path: str) -> str:
    return path.replace("\\", "/")


def _extract_paths_from_text(text: str) -> list:
    return FILE_PATH_PATTERN.findall(text)


def _extract_dependency_like_names(line: str) -> list:
    """
    Extract package-looking tokens from a bullet/list line.

    This is intentionally conservative. The validator should warn about
    suspicious dependency claims, not aggressively flag normal prose.
    """

    cleaned = re.sub(r"`", "", line)

    matches = re.findall(
        r"\b[A-Za-z0-9@][A-Za-z0-9@._/-]{1,80}\b",
        cleaned,
    )

    results = []

    for token in matches:
        lower = token.lower()

        if lower in {
            "dependency",
            "dependencies",
            "runtime",
            "development",
            "package",
            "packages",
            "npm",
            "external",
            "verified",
            "count",
            "version",
            "versions",
            "node",
            "built-in",
            "builtins",
        }:
            continue

        if token.isdigit():
            continue

        results.append(token)

    return results


def _is_node_builtin(name: str) -> bool:
    normalized = name.strip()

    if normalized.startswith("node:"):
        normalized = normalized[5:]

    return normalized.lower() in NODE_BUILTIN_MODULES


def _is_probable_setup_command(line: str) -> bool:
    return bool(SETUP_COMMAND_PATTERN.search(line))



def _guide_mentions_main_entry_point(text: str) -> bool:
    """
    Detect only positive claims that the repository has a single/main
    application entry point.

    Neutral mentions such as headings, discussions of multiple entry
    points, or explicit statements that no single primary entry point
    exists must not count as positive claims.
    """

    negative_patterns = [
        r"\bno\s+(?:single\s+)?(?:confident\s+)?main\s+entry\s+point\b",
        r"\bno\s+(?:single\s+)?(?:confident\s+)?primary\s+entry\s+point\b",
        r"\bno\s+primary\s+entry\s+point\b",
        r"\bno\s+main\s+entry\s+point\b",
        r"\bwithout\s+(?:a\s+)?(?:single\s+)?(?:main|primary)\s+entry\s+point\b",
        r"\b(?:cannot|can't|unable\s+to)\s+"
        r"(?:designate|identify|determine)\s+"
        r"(?:a\s+)?(?:single\s+)?(?:main|primary)\s+entry\s+point\b",
        r"\b(?:does\s+not|doesn't|do\s+not|don't)\s+"
        r"(?:define|identify|expose|provide)\s+"
        r"(?:a\s+)?(?:single\s+)?(?:main|primary)\s+entry\s+point\b",
        r"\b(?:multiple|several|many)\s+"
        r"(?:app|application|server)\s+entry\s+points?\b",
        r"\b(?:multiple|several|many)\s+"
        r"(?:main|primary)\s+entry\s+points?\b",
        r"\bprimary_entry_point\s*(?:is|=)\s*(?:null|none)\b",
    ]

    text_without_negative_claims = text

    for pattern in negative_patterns:
        text_without_negative_claims = re.sub(
            pattern,
            "",
            text_without_negative_claims,
            flags=re.IGNORECASE,
        )

    positive_patterns = [
        # Explicit assignment / identification.
        r"\b(?:the\s+)?main\s+(?:application\s+)?entry\s+point\s+"
        r"(?:is|points?\s+to|resides?\s+in|can\s+be\s+found\s+in)\b",

        r"\b(?:the\s+)?primary\s+(?:application\s+)?entry\s+point\s+"
        r"(?:is|points?\s+to|resides?\s+in|can\s+be\s+found\s+in)\b",

        # Explicit startup claims.
        r"\bthe\s+application\s+(?:starts|start)\s+"
        r"(?:at|from|in)\b",

        r"\bthe\s+app(?:lication)?\s+(?:starts|start)\s+"
        r"(?:at|from|in)\b",

        # Direct single-entry claims.
        r"\b(?:this|the)\s+(?:application|app|project|repository|"
        r"codebase)\s+has\s+(?:a\s+)?"
        r"(?:single\s+|main\s+|primary\s+)?entry\s+point\b",

        r"\b(?:this|the)\s+(?:application|app|project|repository|"
        r"codebase)\s+uses\s+(?:a\s+)?"
        r"(?:single\s+|main\s+|primary\s+)?entry\s+point\b",
    ]

    return any(
        re.search(
            pattern,
            text_without_negative_claims,
            re.IGNORECASE,
        )
        for pattern in positive_patterns
    )




def _find_path_mentions_outside_allowlist(
    guide_text: str,
    normalized_known: set,
) -> list:
    issues = []
    seen_unknown = set()

    matches = list(CODE_PATH_PATTERN.finditer(guide_text))

    for match in matches:
        candidate = match.group(1).strip()
        normalized = _normalize_path(candidate)

        if normalized in normalized_known:
            continue

                # Accept extensionless module references when they map
        # unambiguously to one verified repository file.
        extensionless_matches = [
            known_path
            for known_path in normalized_known
            if known_path.rsplit("/", 1)[-1].rsplit(".", 1)[0] == normalized.rsplit("/", 1)[-1]
            and known_path.startswith(normalized + ".")
        ]

        if len(extensionless_matches) == 1:
            continue

        if "*" in normalized or "?" in normalized:
            pattern = re.escape(normalized)
            pattern = pattern.replace(r"\*", "[^/]*")
            pattern = pattern.replace(r"\?", "[^/]")

            matched_known_path = False

            for known_path in normalized_known:
                if re.fullmatch(pattern, known_path):
                    matched_known_path = True
                    break

            if matched_known_path:
                continue

        if not _looks_like_real_path_candidate(candidate):
            continue

        if normalized in seen_unknown:
            continue

        seen_unknown.add(normalized)

        issues.append(
            {
                "path": candidate,
                "section": None,
                "reason": (
                    "Path is not present in the verified "
                    "repository path allowlist."
                ),
            }
        )

    return issues


def _validate_dependency_section(
    dependency_section: str,
    runtime_dependencies: set,
    package_name: str,
) -> list:
    warnings = []

    if not dependency_section:
        return warnings

    lines = dependency_section.splitlines()

    for line in lines:
        if not BULLET_LINE_PATTERN.match(line):
            continue

        tokens = _extract_dependency_like_names(line)

        for token in tokens:
            normalized = token.lower()

            if _is_node_builtin(normalized):
                warnings.append(
                    f"Dependency Overview mentions Node built-in "
                    f"'{token}' as a dependency. Node built-ins are not "
                    f"external packages."
                )

            if package_name and normalized == package_name.lower():
                warnings.append(
                    f"Dependency Overview lists the repository package "
                    f"name '{token}' as its own dependency."
                )

            if (
                normalized not in runtime_dependencies
                and not normalized.startswith("http")
                and not normalized.endswith(".json")
                and not normalized.endswith(".md")
            ):
                warnings.append(
                    f"Dependency Overview mentions '{token}', but it is "
                    f"not present in the verified runtime dependency sample."
                )

    return warnings


def _validate_application_flow(
    guide_text: str,
    context: dict,
    section_positions: dict,
    section_names: list,
) -> list:
    warnings = []

    flow_hints = context.get("flow_hints", {})
    flows = flow_hints.get("flows", [])

    flow_section = _section_text(
        guide_text,
        "Application Flow",
        section_positions,
        section_names,
    )

    if not flow_section:
        return warnings

    if flows:
        return warnings

    if not flow_hints.get("note"):
        return warnings

    arrow_chains = list(ARROW_CHAIN_PATTERN.finditer(flow_section))

    if arrow_chains:
        warnings.append(
            "Application Flow contains file-to-file arrow chains even "
            "though flow_hints contains no verified runtime flows."
        )

    for pattern in FLOW_LANGUAGE_PATTERNS:
        if pattern.search(flow_section):
            warnings.append(
                "Application Flow makes a runtime flow claim even though "
                "static analysis did not provide a verified flow."
            )
            break

    return warnings


def _validate_primary_entry_point(
    guide_text: str,
    context: dict,
    section_positions: dict,
    section_names: list,
) -> list:
    warnings = []

    primary_entry_point = context.get("primary_entry_point")
    entry_points = context.get("entry_points", [])

    entry_point_section = _section_text(
        guide_text,
        "Entry Points",
        section_positions,
        section_names,
    )

    if primary_entry_point:
        primary_path = _normalize_path(primary_entry_point["path"])

        if (
            _guide_mentions_main_entry_point(entry_point_section)
            and primary_path not in _normalize_path(entry_point_section)
        ):
            warnings.append(
                "Entry Points section claims a main/primary entry point "
                "without referencing the verified primary entry point path."
            )

        return warnings

    production_candidates = [
        entry
        for entry in entry_points
        if entry.get("type") in {"app_entry", "server_entry"}
    ]

    text_without_disclaimer = CONFIRMED_NO_PRIMARY_ENTRY_STATEMENT.sub(
        "",
        guide_text,
    )

    if not production_candidates:
        if _guide_mentions_main_entry_point(text_without_disclaimer):
            warnings.append(
                "Guide claims a main/primary application entry point, but "
                "no confident primary entry point was identified."
            )
        return warnings

    if len(production_candidates) > 1:
        if _guide_mentions_main_entry_point(text_without_disclaimer):
            warnings.append(
                "Guide claims a single main/primary application entry point "
                "although multiple app/server entry points exist and "
                "primary_entry_point is null."
            )

    return warnings


def _validate_non_primary_entry_points(
    guide_text: str,
    context: dict,
) -> list:
    warnings = []

    primary_entry_point = context.get("primary_entry_point")

    primary_path = None

    if primary_entry_point:
        primary_path = _normalize_path(primary_entry_point.get("path", ""))

    non_primary_entries = []

    for entry in context.get("entry_points", []):
        path = _normalize_path(entry.get("path", ""))

        if path and path != primary_path:
            non_primary_entries.append(entry)

    for entry in non_primary_entries:
        path = _normalize_path(entry.get("path", ""))

        if not path:
            continue

        if path not in _normalize_path(guide_text):
            continue

        path_match = re.search(
            re.escape(path),
            guide_text,
            re.IGNORECASE,
        )

        if not path_match:
            continue

        # Check only the line containing the entry-point path.
        # A broad character window can accidentally include unrelated
        # "primary/main entry point" wording from nearby sections.
        line_start = guide_text.rfind(
            "\n",
            0,
            path_match.start(),
        ) + 1

        line_end = guide_text.find(
            "\n",
            path_match.end(),
        )

        if line_end == -1:
            line_end = len(guide_text)

        nearby_text = guide_text[line_start:line_end]

        if _guide_mentions_main_entry_point(nearby_text):
            warnings.append(
                f"Non-primary entry point '{path}' is described as a "
                f"main/primary application entry point."
            )

    return warnings


def _validate_arrow_relationships(
    guide_text: str,
    context: dict,
) -> list:
    warnings = []

    module_summaries = context.get("module_summaries", {})

    normalized_summaries = {
        _normalize_path(path): summary
        for path, summary in module_summaries.items()
    }

    for match in ARROW_CHAIN_PATTERN.finditer(guide_text):
        source = _normalize_path(match.group(1))
        target = _normalize_path(match.group(2))

        source_summary = normalized_summaries.get(source)

        if source_summary is None:
            continue

        resolved = {
            _normalize_path(path)
            for path in source_summary.get("resolved_dependencies", [])
        }

        if target not in resolved and target != source:
            warnings.append(
                f"Flow relationship '{source} -> {target}' is not present "
                f"in the verified resolved dependency graph."
            )

    return warnings


def _validate_setup_commands(
    guide_text: str,
    context: dict,
    section_positions: dict,
    section_names: list,
) -> list:
    warnings = []

    setup_section = _section_text(
        guide_text,
        "Developer Setup",
        section_positions,
        section_names,
    )

    if not setup_section:
        return warnings

    readme_excerpt = context.get("readme_excerpt") or ""

    supported_text = readme_excerpt.lower()

    for line in setup_section.splitlines():
        if not _is_probable_setup_command(line):
            continue

        command_match = SETUP_COMMAND_PATTERN.search(line)

        if not command_match:
            continue

        command = command_match.group(0).strip()

        if command.lower() not in supported_text:
            warnings.append(
                f"Developer Setup contains command '{command}' that is "
                f"not directly supported by the supplied setup evidence."
            )

    return warnings


def validate_onboarding_guide(
    guide_text: str,
    context: dict,
    known_repository_files=None,
) -> dict:
    context_paths = set(context.get("known_file_paths", []))

    if not context_paths:
        context_paths = set(
            context.get("module_summaries", {}).keys()
        )

        context_paths |= {
            entry["path"]
            for entry in context.get("entry_points", [])
            if entry.get("path")
        }

        context_paths |= {
            snippet["file"]
            for snippet in context.get("code_context", [])
            if snippet.get("file")
        }

    full_known_paths = set(known_repository_files or [])
    full_known_paths |= context_paths

    normalized_known = {
        _normalize_path(path)
        for path in full_known_paths
        if path
    }

    section_positions = _locate_sections(
        guide_text,
        context.get(
            "required_sections",
            [
                "Project Overview",
                "Technology Stack",
                "Architecture Overview",
                "Repository Structure",
                "Entry Points",
                "Core Modules",
                "Dependency Overview",
                "Application Flow",
                "Developer Setup",
                "Important Files",
                "Potential Risks / Areas to Understand",
                "Recommended Reading Order",
            ],
        ),
    )

    warnings = []
    path_issues = []

    # ------------------------------------------------------------
    # 1. Unsupported file paths
    # ------------------------------------------------------------

    unsupported_path_issues = _find_path_mentions_outside_allowlist(
        guide_text,
        normalized_known,
    )

    for issue in unsupported_path_issues:
        issue["section"] = _section_for_index(
            guide_text.find(issue["path"]),
            section_positions,
        )

        path_issues.append(issue)

    # ------------------------------------------------------------
    # 2. Dependency validation
    # ------------------------------------------------------------

    dependencies = context.get("dependencies", {})

    runtime_dependencies = {
        str(dep).lower()
        for dep in dependencies.get("runtime_sample", [])
    }

    package_name = dependencies.get("package_name")

    dependency_section = _section_text(
        guide_text,
        "Dependency Overview",
        section_positions,
        list(section_positions.keys()),
    )

    warnings.extend(
        _validate_dependency_section(
            dependency_section,
            runtime_dependencies,
            package_name,
        )
    )

    # ------------------------------------------------------------
    # 3. Application flow validation
    # ------------------------------------------------------------

    warnings.extend(
        _validate_application_flow(
            guide_text,
            context,
            section_positions,
            list(section_positions.keys()),
        )
    )

    # ------------------------------------------------------------
    # 4. Primary entry point validation
    # ------------------------------------------------------------

    warnings.extend(
        _validate_primary_entry_point(
            guide_text,
            context,
            section_positions,
            list(section_positions.keys()),
        )
    )

    # ------------------------------------------------------------
    # 5. Non-primary entry point validation
    # ------------------------------------------------------------

    warnings.extend(
        _validate_non_primary_entry_points(
            guide_text,
            context,
        )
    )

    # ------------------------------------------------------------
    # 6. Verified dependency graph validation
    # ------------------------------------------------------------

    warnings.extend(
        _validate_arrow_relationships(
            guide_text,
            context,
        )
    )

    # ------------------------------------------------------------
    # 7. Developer setup validation
    # ------------------------------------------------------------

    warnings.extend(
        _validate_setup_commands(
            guide_text,
            context,
            section_positions,
            list(section_positions.keys()),
        )
    )

    # ------------------------------------------------------------
    # 8. Monorepo validation
    # ------------------------------------------------------------

    repository_type = context.get("repository_type")

    if repository_type != "monorepo":
        monorepo_claim_patterns = [
            r"\b(?:is|uses|follows|has|contains)\s+(?:a\s+)?monorepo\b",
            r"\bmonorepo\s+(?:structure|architecture|layout|setup)\b",
            r"\b(?:organized|structured|managed)\s+as\s+(?:a\s+)?monorepo\b",
            r"\b(?:this|the)\s+(?:repository|project|codebase)\s+is\s+(?:a\s+)?monorepo\b",
        ]

        if any(
            re.search(pattern, guide_text, re.IGNORECASE)
            for pattern in monorepo_claim_patterns
        ):
            warnings.append(
                "Guide describes the repository as a monorepo even though "
                "repository_type is not 'monorepo'."
            )

    # ------------------------------------------------------------
    # 9. Duplicate warnings cleanup
    # ------------------------------------------------------------

    warnings = list(dict.fromkeys(warnings))

    return {
        "has_warnings": len(warnings) > 0,
        "warnings": warnings,
        "path_issues": path_issues,
    }
