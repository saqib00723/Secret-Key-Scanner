#!/usr/bin/env python3
import sys
import os

def main():
    print("==================================================")
    print(" 🛡️ KeySentinel - Static Security Analysis Tool ")
    print("==================================================")

    # Check if GUI is supported in current environment
    try:
        import customtkinter as ctk
    except ImportError:
        print("\n[!] Error: 'customtkinter' module not found.")
        print("Please install dependencies with: pip install -r requirements.txt")
        sys.exit(1)

    # Check for X11 / Display availability on Linux
    if sys.platform.startswith("linux") and "DISPLAY" not in os.environ and "WAYLAND_DISPLAY" not in os.environ:
        print("\n[!] Warning: No X11/Wayland display server detected in this environment.")
        print("    KeySentinel GUI requires a display environment.")
        print("\n    To run KeySentinel in CLI mode instead, execute:")
        print("    python scanner.py /path/to/project --json")
        sys.exit(0)

    try:
        from gui import KeySentinelGUI
        app = KeySentinelGUI()
        app.run()
    except Exception as e:
        print(f"\n[!] Error launching KeySentinel GUI: {str(e)}")
        print("\nYou can still run scans via CLI:")
        print("  python scanner.py /path/to/project")
        sys.exit(1)

if __name__ == "__main__":
    main()
