import time
import re

from app.services.llm import get_llm_provider, LLMProviderError
from app.services.context_builder import build_llm_context, estimate_context_size
from app.services.prompts import SYSTEM_PROMPT, build_onboarding_prompt
from app.services.response_validator import validate_onboarding_guide


# Only attempt a repair regeneration for a SMALL number of flagged issues -
# a few bad paths is worth one extra Ollama call; a large number suggests
# a systemic grounding failure that a second pass won't reliably fix, and
# doubling generation time (already ~200s+ on a 3B local model) isn't
# worth it in that case. Prompt grounding remains the primary defense;
# this is a bounded safety net, not the main fix.
MAX_GROQ_REQUEST_TOKENS = 7600
GROQ_OUTPUT_TOKENS = 2200
MAX_PATH_ISSUES_FOR_REPAIR = 10


def _replace_section(
    guide_text: str,
    section_name: str,
    replacement: str,
    section_names: list,
) -> str:

    def make_pattern(name: str):
        return re.compile(
            rf"^\s*(?:#+\s*)?(?:\*\*)?(?:\d+[.)]\s*)?"
            rf"{re.escape(name)}(?:\*\*)?\s*$",
            re.IGNORECASE | re.MULTILINE,
        )

    section_pattern = make_pattern(section_name)
    match = section_pattern.search(guide_text)

    if not match:
        return guide_text

    start = match.start()
    later_positions = []

    for name in section_names:
        if name.lower() == section_name.lower():
            continue

        next_match = make_pattern(name).search(
            guide_text,
            match.end(),
        )

        if next_match:
            later_positions.append(next_match.start())

    end = min(later_positions) if later_positions else len(guide_text)

    heading = match.group(0).strip()

    return (
        guide_text[:start]
        + heading
        + "\n\n"
        + replacement.strip()
        + "\n\n"
        + guide_text[end:]
    )


def _apply_grounding_guard(
    guide_text: str,
    context: dict,
    validation: dict,
) -> str:

    section_names = context.get(
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
    )

    # ---------------------------------------------------------
    # 1. No verified primary entry point
    # ---------------------------------------------------------
    if not context.get("primary_entry_point"):

        entry_points = context.get("entry_points", [])

        production_entries = [
            entry
            for entry in entry_points
            if entry.get("type") in {"app_entry", "server_entry"}
        ]

        if not production_entries:

            # Remove hallucinated primary/main entry-point claims.
            lines = guide_text.splitlines()
            cleaned_lines = []

            for line in lines:
                if re.search(
                    r"\b(?:primary|main)\s+(?:application\s+)?entry(?:\s+point)?\b",
                    line,
                    re.IGNORECASE,
                ):
                    continue

                cleaned_lines.append(line)

            guide_text = "\n".join(cleaned_lines)

            # Restore the authoritative Entry Points section.
            guide_text = _replace_section(
                guide_text,
                "Entry Points",
                "No single confident main entry point was identified.",
                section_names,
            )

    # ---------------------------------------------------------
    # 2. No verified runtime flow
    # ---------------------------------------------------------
    flow_hints = context.get("flow_hints", {})

    if not flow_hints.get("flows"):
        guide_text = _replace_section(
            guide_text,
            "Application Flow",
            (
                "Not enough evidence to determine a confident runtime "
                "application flow from the analyzed repository context."
            ),
            section_names,
        )

    # ---------------------------------------------------------
    # 3. Avoid confusing package-entry terminology.
    # Package interfaces are not production application entry points.
    # ---------------------------------------------------------
    guide_text = re.sub(
        r"(?i)\bentry point for the package namespace\b",
        "public package interface and exported API",
        guide_text,
    )

    guide_text = re.sub(
        r"(?i)\bpackage entry point\b",
        "public package interface",
        guide_text,
    )

    # ---------------------------------------------------------
    # 4. Remove unsupported file-path bullets
    # ---------------------------------------------------------
    path_issues = validation.get("path_issues", [])

    if path_issues:

        unsupported_paths = {
            issue["path"].strip()
            for issue in path_issues
            if issue.get("path")
        }

        lines = guide_text.splitlines()
        cleaned_lines = []

        for line in lines:

            if any(
                re.search(
                    rf"(?<![\w.-]){re.escape(path)}(?![\w.-])",
                    line,
                    re.IGNORECASE,
                )
                for path in unsupported_paths
            ):
                continue

            cleaned_lines.append(line)

        guide_text = "\n".join(cleaned_lines)

    return guide_text


def _build_repair_prompt(
    original_guide: str,
    path_issues: list,
    warnings: list,
    known_file_paths: list,
    primary_entry_point=None,
) -> str:

    issues_text = "\n".join(
        f"- \"{issue['path']}\" "
        f"(in section: {issue['section']}) - {issue['reason']}"
        for issue in path_issues
    )

    warnings_text = "\n".join(
        f"- {warning}"
        for warning in warnings
    )

    known_paths_text = "\n".join(
        f"- {path}"
        for path in known_file_paths
    )

    if primary_entry_point:

        primary_entry_instruction = (
            f"VERIFIED PRIMARY ENTRY POINT: "
            f"{primary_entry_point['path']}"
        )

    else:

        primary_entry_instruction = """CRITICAL VALIDATION FAILURE — NO PRIMARY ENTRY POINT EXISTS.

The repository analysis has VERIFIED that there is NO production
application primary entry point.

The generated guide MUST NOT say that index.js, app.js, server.js,
main.js, or ANY other file is a primary/main application entry point.

The "Entry Points" section MUST contain exactly this statement:

"No single confident main entry point was identified."

You may mention verified non-primary entry points such as test_entry,
fixture_entry, script_entry, or package_entry, but NEVER call them
the main or primary application entry point.

Do NOT infer a primary entry point from:
- filenames
- imports
- exports
- framework conventions
- code_context
- repository type
- your knowledge of Express.js

If the previous guide says any file is a primary entry point,
REMOVE that claim instead of replacing it with another filename."""

    return f"""{primary_entry_instruction}

Here is an onboarding guide you previously generated for a repository:

---
{original_guide}
---

The following validation warnings must also be fixed:

{warnings_text}

The following file path claims in the guide above could NOT be verified
against the repository's actual file list and must be corrected:

{issues_text}

Here is the complete list of valid repository file paths you are
allowed to reference:

{known_paths_text}

Rewrite the FULL guide, keeping all correct content unchanged.

For each sentence referencing one of the unsupported paths listed above,
either:

- replace it with a path that is an EXACT character-for-character match
  to an entry in the valid list above if one genuinely fits the same role

or

- remove the specific invented path entirely and instead say:
  "Not enough evidence to specify the exact file for this."

A path that merely resembles a real one (different capitalization,
singular/plural, a nearby directory name) is STILL an invented path
and is not an acceptable fix.

Only an exact match from the valid list counts.

Do not introduce any new file path beyond the valid list.

Before outputting the corrected guide, perform this mandatory check:

If NO VERIFIED PRIMARY ENTRY POINT EXISTS, search your entire generated
guide for the words "primary entry point", "main entry point",
"primary application entry point", or equivalent claims.

Remove every claim that identifies a file as the primary/main entry point.

The only allowed statement is:

"No single confident main entry point was identified."

Then output the complete corrected guide only, with the same section
structure as before."""


def generate_onboarding_guide(
    project_info: dict,
    dependencies: dict,
    structure: dict,
    repository_context: dict,
    file_contents: dict,
    relevant_files: list = None,
    file_priorities: dict = None,
):

    context = build_llm_context(
        project_info=project_info,
        dependencies=dependencies,
        structure=structure,
        repository_context=repository_context,
        file_contents=file_contents,
        relevant_files=relevant_files,
        file_priorities=file_priorities,
    )

    # ---------------------------------------------------------
    # Build prompt and enforce Groq request budget
    # ---------------------------------------------------------

    prompt = build_onboarding_prompt(context)

    system_tokens = len(SYSTEM_PROMPT) // 4
    user_tokens = len(prompt) // 4

    estimated_request_tokens = (
        system_tokens
        + user_tokens
        + GROQ_OUTPUT_TOKENS
    )

    print(
        f"[prompt_debug] initial request estimate: "
        f"{estimated_request_tokens} tokens"
    )

    if estimated_request_tokens > MAX_GROQ_REQUEST_TOKENS:

        print(
            "[prompt_debug] context exceeds Groq budget, "
            "applying compact context profile"
        )

        context = build_llm_context(
            project_info=project_info,
            dependencies=dependencies,
            structure=structure,
            repository_context=repository_context,
            file_contents=file_contents,
            relevant_files=relevant_files,
            file_priorities=file_priorities,
            max_module_summaries=18,
            max_code_snippets=1,
            max_snippet_chars=350,
            max_readme_chars=1000,
        )

        prompt = build_onboarding_prompt(context)

        system_tokens = len(SYSTEM_PROMPT) // 4
        user_tokens = len(prompt) // 4

        estimated_request_tokens = (
            system_tokens
            + user_tokens
            + GROQ_OUTPUT_TOKENS
        )

        print(
            f"[prompt_debug] compact request estimate: "
            f"{estimated_request_tokens} tokens"
        )

    size_info = estimate_context_size(context)

    print(
        f"[onboarding_generator] repository_type: "
        f"{context['repository_type']}"
    )

    print(
        f"[onboarding_generator] known_file_paths count: "
        f"{len(context['known_file_paths'])}"
    )

    print(
        f"[onboarding_generator] context size: "
        f"{size_info['characters']} chars "
        f"(~{size_info['approx_tokens']} tokens)"
    )

    provider = get_llm_provider()

    print(
        f"[onboarding_generator] using provider: "
        f"{provider.__class__.__name__}"
    )

    print(
        f"[prompt_debug] system_prompt chars: "
        f"{len(SYSTEM_PROMPT)}"
    )

    print(
        f"[prompt_debug] user_prompt chars: "
        f"{len(prompt)}"
    )

    print(
        f"[prompt_debug] estimated input tokens: "
        f"{(len(SYSTEM_PROMPT) + len(prompt)) // 4}"
    )

    print(
        f"[prompt_debug] estimated total request tokens: "
        f"{estimated_request_tokens}"
    )

        # ---------------------------------------------------------
    # Final tight context profile for very large repositories
    # ---------------------------------------------------------

    if estimated_request_tokens > MAX_GROQ_REQUEST_TOKENS:

        print(
            "[prompt_debug] compact profile still exceeds budget, "
            "applying tight context profile"
        )

        context = build_llm_context(
            project_info=project_info,
            dependencies=dependencies,
            structure=structure,
            repository_context=repository_context,
            file_contents=file_contents,
            relevant_files=relevant_files,
            file_priorities=file_priorities,
            max_module_summaries=12,
            max_code_snippets=0,
            max_snippet_chars=0,
            max_readme_chars=700,
        )

        prompt = build_onboarding_prompt(context)

        system_tokens = len(SYSTEM_PROMPT) // 4
        user_tokens = len(prompt) // 4

        estimated_request_tokens = (
            system_tokens
            + user_tokens
            + GROQ_OUTPUT_TOKENS
        )

        print(
            f"[prompt_debug] tight request estimate: "
            f"{estimated_request_tokens} tokens"
        )

    print("[onboarding_generator] onboarding generation started")

    start_time = time.time()

    try:
        result_text = provider.generate(
            prompt=prompt,
            system_prompt=SYSTEM_PROMPT,
        )

        print("[encoding_debug]",
               "has_en_dash=", "–" in result_text,
               "has_mojibake=", "â" in result_text,
               "length=", len(result_text),
               )

    except LLMProviderError as error:

        print(
            f"[onboarding_generator] provider error: {error}"
        )

        raise

    elapsed = time.time() - start_time

    print(
        f"[onboarding_generator] onboarding generation completed "
        f"in {elapsed:.1f}s"
    )

    # ---------------------------------------------------------
    # First validation
    # ---------------------------------------------------------
    validation = validate_onboarding_guide(
        result_text,
        context,
        known_repository_files=relevant_files,
    )

    # ---------------------------------------------------------
    # Deterministic grounding guard
    # ---------------------------------------------------------
    result_text = _apply_grounding_guard(
        result_text,
        context,
        validation,
    )

    print("[encoding_after_guard]",
            "has_en_dash=", "–" in result_text,
            "has_mojibake=", "â" in result_text,
            "length=", len(result_text),
          )   

    # ---------------------------------------------------------
    # Final validation after grounding guard
    # ---------------------------------------------------------
    validation = validate_onboarding_guide(
        result_text,
        context,
        known_repository_files=relevant_files,
    )

    print(
        f"[onboarding_generator] DEBUG path_issues: "
        f"{[i['path'] for i in validation['path_issues']]}"
    )

    issue_count = len(validation["path_issues"])
    warning_count = len(validation["warnings"])
    total_issues = issue_count + warning_count

    if total_issues == 0:

        print(
            "[onboarding_generator] validation: no issues flagged"
        )

    else:

        print(
            f"[onboarding_generator] {total_issues} validation "
            f"issue(s) remain after deterministic grounding guard"
        )

    if validation["has_warnings"]:

        for warning in validation["warnings"]:

            print(
                f"[onboarding_generator] VALIDATION WARNING: "
                f"{warning}"
            )

    return {
        "onboarding_guide": result_text,
        "context_size": size_info,
        "provider": provider.__class__.__name__,
        "repository_type": context["repository_type"],
        "generation_time_seconds": round(elapsed, 1),
        "validation": validation,
    }