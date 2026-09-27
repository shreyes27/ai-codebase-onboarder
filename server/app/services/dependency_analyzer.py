import json
import os
import tomllib


NODE_BUILTIN_MODULES = {
    "assert", "async_hooks", "buffer", "child_process", "cluster", "console",
    "constants", "crypto", "dgram", "diagnostics_channel", "dns", "domain",
    "events", "fs", "http", "http2", "https", "inspector", "module", "net",
    "os", "path", "perf_hooks", "process", "punycode", "querystring",
    "readline", "repl", "stream", "string_decoder", "sys", "timers", "tls",
    "trace_events", "tty", "url", "util", "v8", "vm", "wasi", "worker_threads",
    "zlib",
}


def _is_node_builtin(name: str) -> bool:
    normalized = name[5:] if name.startswith("node:") else name
    return normalized in NODE_BUILTIN_MODULES


def analyze_dependencies(repo_path: str):
    dependencies = {
        "runtime": [],
        "development": [],
        "package_name": None,
        "excluded_builtins": [],
    }

    package_json_path = os.path.join(
        repo_path,
        "package.json",
    )

    if os.path.exists(package_json_path):
        with open(
            package_json_path,
            "r",
            encoding="utf-8",
        ) as file:
            package_data = json.load(file)

        dependencies["package_name"] = package_data.get(
            "name"
        )

        runtime = list(
            package_data.get(
                "dependencies",
                {},
            ).keys()
        )

        development = list(
            package_data.get(
                "devDependencies",
                {},
            ).keys()
        )

        excluded = []

        def _clean(dep_list):
            cleaned = []

            for name in dep_list:
                if _is_node_builtin(name):
                    excluded.append(name)
                    continue

                if (
                    dependencies["package_name"]
                    and name == dependencies["package_name"]
                ):
                    excluded.append(name)
                    continue

                cleaned.append(name)

            return cleaned

        dependencies["runtime"] = _clean(runtime)
        dependencies["development"] = _clean(development)
        dependencies["excluded_builtins"] = excluded

    requirements_path = os.path.join(
        repo_path,
        "requirements.txt",
    )

    if os.path.exists(requirements_path):
        with open(
            requirements_path,
            "r",
            encoding="utf-8",
        ) as file:
            python_dependencies = []

            for line in file:
                line = line.strip()

                if line and not line.startswith("#"):
                    package_name = line.split(
                        "==",
                        1,
                    )[0].strip()

                    python_dependencies.append(
                        package_name
                    )

            dependencies["runtime"].extend(
                python_dependencies
            )

    pyproject_path = os.path.join(
        repo_path,
        "pyproject.toml",
    )

    if os.path.exists(pyproject_path):
        with open(
            pyproject_path,
            "rb",
        ) as file:
            pyproject_data = tomllib.load(file)

        project = pyproject_data.get(
            "project",
            {},
        )

        if not dependencies["package_name"]:
            dependencies["package_name"] = project.get(
                "name"
            )

        python_dependencies = project.get(
            "dependencies",
            [],
        )

        for dependency in python_dependencies:
            dependency_name = (
                dependency
                .split(";", 1)[0]
                .strip()
            )

            dependency_name = dependency_name.split(
                "[",
                1,
            )[0].strip()

            if dependency_name:
                dependencies["runtime"].append(
                    dependency_name
                )

    dependencies["runtime"] = list(
        dict.fromkeys(
            dependencies["runtime"]
        )
    )

    dependencies["development"] = list(
        dict.fromkeys(
            dependencies["development"]
        )
    )

    return dependencies