import re
import os

# Default compiled regex patterns for common API keys, tokens, and credentials
SECRET_PATTERNS = {
    "AWS Access Key": re.compile(r"\b(AKIA[0-9A-Z]{16})\b"),
    "AWS Secret Key": re.compile(r"(?i)aws_(?:secret|access|key)?_?(?:key|token)?\s*[:=]\s*[\"']([0-9a-zA-Z\/+]{40})[\"']"),
    "OpenAI API Key": re.compile(r"\b(sk-(?:proj-|admin-|[a-zA-Z0-9]{2,}-)?[a-zA-Z0-9]{32,})\b"),
    "GitHub Personal Access Token": re.compile(r"\b(ghp_[a-zA-Z0-9]{36})\b"),
    "GitHub Fine-Grained Token": re.compile(r"\b(github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59})\b"),
    "GitHub OAuth Token": re.compile(r"\b(gho_[a-zA-Z0-9]{36})\b"),
    "Slack Token": re.compile(r"\b(xox[baprs]-[a-zA-Z0-9]{10,48})\b"),
    "Slack Webhook URL": re.compile(r"https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]{8,12}\/B[a-zA-Z0-9_]{8,12}\/[a-zA-Z0-9_]{24}"),
    "Stripe API Key": re.compile(r"\b((?:sk|pk)_(?:live|test)_[0-9a-zA-Z]{24,99})\b"),
    "Google API Key": re.compile(r"\b(AIzaSy[0-9A-Za-z-_]{35})\b"),
    "JWT Token": re.compile(r"\b(eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*)\b"),
    "Private Key Header": re.compile(r"-----BEGIN (?:RSA|DSA|EC|OPENSSH|PGP) PRIVATE KEY-----"),
    "Database Connection String": re.compile(r"(?:postgres|postgresql|mysql|mongodb|redis|mongodb\+srv):\/\/[^:\s]+:([^@\s]+)@[^:\s]+:[0-9]+"),
    "Generic Password / Secret": re.compile(r"(?i)(?:password|passwd|secret_key|api_secret|auth_token|access_token|private_key)\s*[:=]\s*[\"']([^\"']{8,})[\"']"),
}

# Directories to ignore during scanning
DEFAULT_IGNORE_DIRS = {
    ".git",
    "node_modules",
    "__pycache__",
    ".venv",
    "venv",
    "env",
    ".idea",
    ".vscode",
    "dist",
    "build",
    ".pytest_cache",
    ".mypy_cache",
    "coverage",
    ".next",
    ".nuxt",
}

# File extensions to ignore (binary / image / compiled formats)
DEFAULT_IGNORE_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".bmp", ".webp",
    ".exe", ".dll", ".so", ".dylib", ".bin", ".pyc", ".pyo",
    ".zip", ".tar", ".gz", ".7z", ".rar",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx",
    ".mp3", ".mp4", ".avi", ".mov",
    ".woff", ".woff2", ".ttf", ".eot",
    ".lock", ".sqlite", ".db"
}

# Maximum file size to scan (in bytes) - Default 5MB
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
