import os
import sys
import json
import time
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional, Callable, Set

from patterns import (
    SECRET_PATTERNS,
    DEFAULT_IGNORE_DIRS,
    DEFAULT_IGNORE_EXTENSIONS,
    MAX_FILE_SIZE_BYTES,
)

@dataclass
class SecretFinding:
    filepath: str
    line_number: int
    secret_type: str
    masked_value: str
    full_line: str
    match_start: int
    match_end: int

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

class SecretScanner:
    def __init__(
        self,
        patterns: Optional[Dict[str, Any]] = None,
        ignore_dirs: Optional[Set[str]] = None,
        ignore_exts: Optional[Set[str]] = None,
        max_file_size_mb: float = 5.0,
    ):
        self.patterns = patterns or SECRET_PATTERNS
        self.ignore_dirs = ignore_dirs or DEFAULT_IGNORE_DIRS
        self.ignore_exts = ignore_exts or DEFAULT_IGNORE_EXTENSIONS
        self.max_file_size_bytes = int(max_file_size_mb * 1024 * 1024)

    @staticmethod
    def mask_secret(secret_str: str) -> str:
        """Mask sensitive string keeping first 4 and last 4 characters if possible."""
        clean_str = secret_str.strip()
        length = len(clean_str)
        if length <= 8:
            return "*" * length
        prefix = clean_str[:4]
        suffix = clean_str[-4:]
        masked_middle = "*" * min(8, length - 8)
        return f"{prefix}{masked_middle}{suffix}"

    def is_ignored_path(self, path: Path) -> bool:
        """Check if file or any parent folder is in the ignore list."""
        for part in path.parts:
            if part in self.ignore_dirs:
                return True
        if path.suffix.lower() in self.ignore_exts:
            return True
        return False

    def scan_file(self, file_path: Path) -> List[SecretFinding]:
        """Scan a single file line by line for secrets."""
        findings: List[SecretFinding] = []
        if not file_path.is_file():
            return findings

        # Skip ignored paths
        if self.is_ignored_path(file_path):
            return findings

        # Check file size limit
        try:
            if file_path.stat().st_size > self.max_file_size_bytes:
                return findings
        except Exception:
            return findings

        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                for line_idx, line in enumerate(f, start=1):
                    # Quick skip for extremely long minified code lines (>2000 chars)
                    if len(line) > 2000:
                        continue

                    for secret_type, regex_pattern in self.patterns.items():
                        for match in regex_pattern.finditer(line):
                            raw_val = match.group(0)
                            # If regex has capture groups, take group 1 if available
                            if match.groups():
                                raw_val = match.group(1) or match.group(0)

                            if not raw_val or len(raw_val.strip()) < 4:
                                continue

                            masked = self.mask_secret(raw_val)
                            findings.append(
                                SecretFinding(
                                    filepath=str(file_path),
                                    line_number=line_idx,
                                    secret_type=secret_type,
                                    masked_value=masked,
                                    full_line=line.strip(),
                                    match_start=match.start(),
                                    match_end=match.end(),
                                )
                            )
        except PermissionError:
            pass
        except Exception as e:
            # Silently ignore binary read issues or file read errors
            pass

        return findings

    def scan_directory(
        self,
        directory_path: str,
        progress_callback: Optional[Callable[[str, int, int], None]] = None,
        cancel_check: Optional[Callable[[], bool]] = None,
    ) -> Dict[str, Any]:
        """
        Recursively scan directory for secret patterns.
        `progress_callback` signature: (current_file_path, files_scanned, total_files)
        """
        start_time = time.time()
        root_dir = Path(directory_path).resolve()

        if not root_dir.exists():
            return {
                "error": f"Path not found: {directory_path}",
                "findings": [],
                "stats": {"files_scanned": 0, "secrets_found": 0, "duration": 0},
            }

        all_files: List[Path] = []
        if root_dir.is_file():
            if not self.is_ignored_path(root_dir):
                all_files.append(root_dir)
        elif root_dir.is_dir():
            try:
                for path in root_dir.rglob("*"):
                    if path.is_file() and not self.is_ignored_path(path):
                        all_files.append(path)
            except Exception as e:
                return {
                    "error": f"Error discovering files: {str(e)}",
                    "findings": [],
                    "stats": {"files_scanned": 0, "secrets_found": 0, "duration": 0},
                }
        else:
            return {
                "error": f"Invalid path type: {directory_path}",
                "findings": [],
                "stats": {"files_scanned": 0, "secrets_found": 0, "duration": 0},
            }

        total_files = len(all_files)
        files_scanned = 0
        all_findings: List[SecretFinding] = []

        for file_path in all_files:
            if cancel_check and cancel_check():
                break

            files_scanned += 1
            if progress_callback:
                progress_callback(str(file_path), files_scanned, total_files)

            file_findings = self.scan_file(file_path)
            all_findings.extend(file_findings)

        duration = round(time.time() - start_time, 2)

        return {
            "root_directory": str(root_dir),
            "findings": [f.to_dict() for f in all_findings],
            "stats": {
                "files_scanned": files_scanned,
                "total_files": total_files,
                "secrets_found": len(all_findings),
                "duration_seconds": duration,
            },
        }

if __name__ == "__main__":
    # CLI mode for testing or automation
    if len(sys.argv) > 1:
        target_dir = sys.argv[1]
        as_json = "--json" in sys.argv
        scanner = SecretScanner()
        results = scanner.scan_directory(target_dir)
        if as_json:
            print(json.dumps(results, indent=2))
        else:
            print(f"KeySentinel Scan Report for: {results.get('root_directory')}")
            print(f"Files Scanned: {results['stats']['files_scanned']} / {results['stats']['total_files']}")
            print(f"Secrets Found: {results['stats']['secrets_found']}")
            print(f"Time Taken: {results['stats']['duration_seconds']}s\n")
            for finding in results["findings"]:
                print(f"[{finding['secret_type']}] {finding['filepath']}:{finding['line_number']}")
                print(f"  Masked Secret: {finding['masked_value']}")
                print(f"  Line: {finding['full_line'][:80]}")
                print("-" * 50)
    else:
        print("Usage: python scanner.py <directory_path> [--json]")
