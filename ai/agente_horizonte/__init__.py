def __getattr__(name: str):
    """Expose the agent to `adk eval` without loading external data on every import."""
    if name == "agent":
        import sys
        from importlib import import_module
        from pathlib import Path

        # `adk eval` loads this file directly without adding ai/ to sys.path.
        package_parent = str(Path(__file__).resolve().parent.parent)
        if package_parent not in sys.path:
            sys.path.insert(0, package_parent)
        return import_module("agente_horizonte.agent")
    raise AttributeError(name)
