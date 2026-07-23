import os
import sys
import json
import threading
import queue
import time
from pathlib import Path
from typing import List, Dict, Any, Optional

try:
    import customtkinter as ctk
    from tkinter import filedialog, messagebox
    CTK_AVAILABLE = True
except ImportError:
    CTK_AVAILABLE = False

from scanner import SecretScanner, SecretFinding
from patterns import SECRET_PATTERNS

class KeySentinelGUI:
    def __init__(self):
        if not CTK_AVAILABLE:
            raise ImportError(
                "customtkinter is required to run KeySentinel GUI.\n"
                "Please run: pip install customtkinter pillow"
            )

        # Set Appearance Mode and Theme
        ctk.set_appearance_mode("Dark")
        ctk.set_default_color_theme("blue")

        self.root = ctk.CTk()
        self.root.title("KeySentinel - DevSecOps Static Secret Scanner")
        self.root.geometry("1080x720")
        self.root.minsize(900, 600)

        # Scanner state variables
        self.scanner = SecretScanner()
        self.selected_dir: Optional[str] = None
        self.is_scanning = False
        self.cancel_scan_flag = False
        self.scan_thread: Optional[threading.Thread] = None
        self.queue = queue.Queue()

        self.findings: List[Dict[str, Any]] = []
        self.stats: Dict[str, Any] = {"files_scanned": 0, "total_files": 0, "secrets_found": 0, "duration": 0}

        self._build_ui()
        self.root.after(100, self._process_queue)

    def _build_ui(self):
        # Grid layout configuration
        self.root.grid_columnconfigure(0, weight=1)
        self.root.grid_rowconfigure(2, weight=1)

        # --- 1. HEADER ZONE ---
        self.header_frame = ctk.CTkFrame(self.root, corner_radius=12, fg_color="#1E222A")
        self.header_frame.grid(row=0, column=0, padx=16, pady=(16, 8), sticky="ew")
        self.header_frame.grid_columnconfigure(1, weight=1)

        title_sub_frame = ctk.CTkFrame(self.header_frame, fg_color="transparent")
        title_sub_frame.grid(row=0, column=0, padx=16, pady=12, sticky="w")

        self.logo_label = ctk.CTkLabel(
            title_sub_frame,
            text="🛡️ KeySentinel",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color="#61AFEF"
        )
        self.logo_label.pack(anchor="w")

        self.subtitle_label = ctk.CTkLabel(
            title_sub_frame,
            text="Static Security Scanner for Hardcoded Keys & Credentials",
            font=ctk.CTkFont(size=12),
            text_color="#A0A8B6"
        )
        self.subtitle_label.pack(anchor="w")

        # Directory selection controls
        dir_controls_frame = ctk.CTkFrame(self.header_frame, fg_color="transparent")
        dir_controls_frame.grid(row=0, column=1, padx=16, pady=12, sticky="e")

        self.browse_btn = ctk.CTkButton(
            dir_controls_frame,
            text="📁 Select Project Folder",
            font=ctk.CTkFont(size=13, weight="bold"),
            fg_color="#2B3245",
            hover_color="#3B445C",
            command=self.browse_directory
        )
        self.browse_btn.pack(side="right", padx=(8, 0))

        self.dir_path_label = ctk.CTkLabel(
            dir_controls_frame,
            text="No directory selected",
            font=ctk.CTkFont(size=12, italic=True),
            text_color="#808A9D",
            wraplength=400,
            justify="right"
        )
        self.dir_path_label.pack(side="right", padx=8)

        # --- 2. CONTROL BAR & PROGRESS ZONE ---
        self.control_frame = ctk.CTkFrame(self.root, corner_radius=12, fg_color="#1E222A")
        self.control_frame.grid(row=1, column=0, padx=16, pady=8, sticky="ew")
        self.control_frame.grid_columnconfigure(1, weight=1)

        self.start_btn = ctk.CTkButton(
            self.control_frame,
            text="🚀 Start Scan",
            font=ctk.CTkFont(size=14, weight="bold"),
            fg_color="#98C379",
            hover_color="#7FA862",
            text_color="#1E222A",
            height=36,
            command=self.start_scan
        )
        self.start_btn.grid(row=0, column=0, padx=16, pady=12)

        self.stop_btn = ctk.CTkButton(
            self.control_frame,
            text="🛑 Cancel",
            font=ctk.CTkFont(size=13, weight="bold"),
            fg_color="#E06C75",
            hover_color="#BE505A",
            height=36,
            state="disabled",
            command=self.cancel_scan
        )
        self.stop_btn.grid(row=0, column=1, padx=(0, 16), pady=12, sticky="w")

        progress_info_frame = ctk.CTkFrame(self.control_frame, fg_color="transparent")
        progress_info_frame.grid(row=0, column=2, padx=16, pady=8, sticky="ew")
        progress_info_frame.grid_columnconfigure(0, weight=1)

        self.status_label = ctk.CTkLabel(
            progress_info_frame,
            text="Ready to scan project files",
            font=ctk.CTkFont(size=12),
            text_color="#ABB2BF",
            anchor="w"
        )
        self.status_label.grid(row=0, column=0, sticky="w", pady=(0, 4))

        self.progress_bar = ctk.CTkProgressBar(progress_info_frame, height=8, progress_color="#61AFEF")
        self.progress_bar.grid(row=1, column=0, sticky="ew")
        self.progress_bar.set(0)

        # --- 3. RESULTS AREA ---
        self.tabview = ctk.CTkTabview(self.root, corner_radius=12, fg_color="#1E222A")
        self.tabview.grid(row=2, column=0, padx=16, pady=8, sticky="nsew")

        self.results_tab = self.tabview.add("Findings")
        self.patterns_tab = self.tabview.add("Detection Patterns")

        self._setup_findings_tab()
        self._setup_patterns_tab()

        # --- 4. FOOTER ZONE ---
        self.footer_frame = ctk.CTkFrame(self.root, corner_radius=12, fg_color="#1E222A")
        self.footer_frame.grid(row=3, column=0, padx=16, pady=(8, 16), sticky="ew")

        self.files_scanned_label = ctk.CTkLabel(
            self.footer_frame,
            text="Files Scanned: 0",
            font=ctk.CTkFont(size=12, weight="bold"),
            text_color="#ABB2BF"
        )
        self.files_scanned_label.pack(side="left", padx=16, pady=10)

        self.secrets_found_label = ctk.CTkLabel(
            self.footer_frame,
            text="Secrets Found: 0",
            font=ctk.CTkFont(size=12, weight="bold"),
            text_color="#E5C07B"
        )
        self.secrets_found_label.pack(side="left", padx=16, pady=10)

        self.duration_label = ctk.CTkLabel(
            self.footer_frame,
            text="Duration: 0.0s",
            font=ctk.CTkFont(size=12),
            text_color="#808A9D"
        )
        self.duration_label.pack(side="left", padx=16, pady=10)

        self.export_txt_btn = ctk.CTkButton(
            self.footer_frame,
            text="📄 Export TXT",
            font=ctk.CTkFont(size=12, weight="bold"),
            fg_color="#2B3245",
            hover_color="#3B445C",
            state="disabled",
            width=110,
            command=lambda: self.export_report("txt")
        )
        self.export_txt_btn.pack(side="right", padx=(4, 16), pady=10)

        self.export_json_btn = ctk.CTkButton(
            self.footer_frame,
            text="💾 Export JSON",
            font=ctk.CTkFont(size=12, weight="bold"),
            fg_color="#2B3245",
            hover_color="#3B445C",
            state="disabled",
            width=110,
            command=lambda: self.export_report("json")
        )
        self.export_json_btn.pack(side="right", padx=4, pady=10)

    def _setup_findings_tab(self):
        self.results_tab.grid_columnconfigure(0, weight=1)
        self.results_tab.grid_rowconfigure(1, weight=1)

        # Filter bar
        filter_frame = ctk.CTkFrame(self.results_tab, fg_color="transparent")
        filter_frame.grid(row=0, column=0, padx=8, pady=(4, 8), sticky="ew")

        self.search_entry = ctk.CTkEntry(
            filter_frame,
            placeholder_text="Search findings by filename or type...",
            font=ctk.CTkFont(size=12),
            height=32
        )
        self.search_entry.pack(side="left", fill="x", expand=True, padx=(0, 8))
        self.search_entry.bind("<KeyRelease>", lambda e: self.filter_findings())

        self.category_menu = ctk.CTkOptionMenu(
            filter_frame,
            values=["All Categories"] + list(SECRET_PATTERNS.keys()),
            command=lambda choice: self.filter_findings(),
            height=32
        )
        self.category_menu.pack(side="right")

        # Scrollable list for results
        self.scroll_results = ctk.CTkScrollableFrame(self.results_tab, fg_color="#181B20", corner_radius=8)
        self.scroll_results.grid(row=1, column=0, padx=8, pady=4, sticky="nsew")
        self.scroll_results.grid_columnconfigure(0, weight=1)

        self._show_empty_placeholder("Select a project directory and click 'Start Scan' to begin analysis.")

    def _setup_patterns_tab(self):
        self.patterns_tab.grid_columnconfigure(0, weight=1)
        self.patterns_tab.grid_rowconfigure(0, weight=1)

        patterns_scroll = ctk.CTkScrollableFrame(self.patterns_tab, fg_color="#181B20", corner_radius=8)
        patterns_scroll.grid(row=0, column=0, padx=8, pady=8, sticky="nsew")
        patterns_scroll.grid_columnconfigure(1, weight=1)

        row_idx = 0
        for name, pattern in SECRET_PATTERNS.items():
            card = ctk.CTkFrame(patterns_scroll, fg_color="#21252B", corner_radius=6)
            card.pack(fill="x", padx=8, pady=4)
            
            lbl_name = ctk.CTkLabel(
                card,
                text=f"🔑 {name}",
                font=ctk.CTkFont(size=13, weight="bold"),
                text_color="#61AFEF"
            )
            lbl_name.pack(anchor="w", padx=12, pady=(8, 2))

            lbl_regex = ctk.CTkLabel(
                card,
                text=f"Regex: {pattern.pattern}",
                font=ctk.CTkFont(size=11, family="Courier"),
                text_color="#98C379",
                wraplength=800,
                justify="left"
            )
            lbl_regex.pack(anchor="w", padx=12, pady=(0, 8))

    def _show_empty_placeholder(self, message: str):
        for widget in self.scroll_results.winfo_children():
            widget.destroy()

        lbl = ctk.CTkLabel(
            self.scroll_results,
            text=f"🔍 {message}",
            font=ctk.CTkFont(size=14, italic=True),
            text_color="#5C6370"
        )
        lbl.pack(pady=40)

    def browse_directory(self):
        selected = filedialog.askdirectory(title="Select Project Directory to Scan")
        if selected:
            self.selected_dir = selected
            self.dir_path_label.configure(text=selected, text_color="#61AFEF")
            self.status_label.configure(text=f"Selected folder: {selected}")

    def start_scan(self):
        if not self.selected_dir or not os.path.isdir(self.selected_dir):
            messagebox.showwarning("No Directory", "Please select a valid project directory first.")
            return

        self.is_scanning = True
        self.cancel_scan_flag = False

        self.start_btn.configure(state="disabled", fg_color="#4B5263")
        self.browse_btn.configure(state="disabled")
        self.stop_btn.configure(state="normal")
        self.export_json_btn.configure(state="disabled")
        self.export_txt_btn.configure(state="disabled")

        self.progress_bar.set(0)
        self.status_label.configure(text="Discovering files...")
        self.findings.clear()
        self._show_empty_placeholder("Scanning in progress...")

        # Run background thread
        self.scan_thread = threading.Thread(
            target=self._run_scan_thread,
            args=(self.selected_dir,),
            daemon=True
        )
        self.scan_thread.start()

    def cancel_scan(self):
        if self.is_scanning:
            self.cancel_scan_flag = True
            self.status_label.configure(text="Cancelling scan...")

    def _run_scan_thread(self, dir_path: str):
        def progress_cb(current_file: str, scanned: int, total: int):
            self.queue.put(("progress", (current_file, scanned, total)))

        def cancel_check() -> bool:
            return self.cancel_scan_flag

        results = self.scanner.scan_directory(
            dir_path,
            progress_callback=progress_cb,
            cancel_check=cancel_check
        )
        self.queue.put(("completed", results))

    def _process_queue(self):
        try:
            while True:
                msg_type, data = self.queue.get_nowait()
                if msg_type == "progress":
                    current_file, scanned, total = data
                    ratio = scanned / max(1, total)
                    self.progress_bar.set(ratio)
                    filename = Path(current_file).name
                    self.status_label.configure(text=f"Scanning ({scanned}/{total}): {filename}")
                    self.files_scanned_label.configure(text=f"Files Scanned: {scanned}/{total}")

                elif msg_type == "completed":
                    self.is_scanning = False
                    self.start_btn.configure(state="normal", fg_color="#98C379")
                    self.browse_btn.configure(state="normal")
                    self.stop_btn.configure(state="disabled")

                    if "error" in data:
                        self.status_label.configure(text=f"Error: {data['error']}")
                        messagebox.showerror("Scan Error", data["error"])
                        return

                    self.findings = data.get("findings", [])
                    self.stats = data.get("stats", {})

                    secrets_count = self.stats.get("secrets_found", 0)
                    duration = self.stats.get("duration_seconds", 0)

                    self.progress_bar.set(1.0)
                    if self.cancel_scan_flag:
                        self.status_label.configure(text=f"Scan cancelled. Found {secrets_count} secrets.")
                    else:
                        self.status_label.configure(text=f"Scan complete in {duration}s! Found {secrets_count} potential secrets.")

                    self.files_scanned_label.configure(
                        text=f"Files Scanned: {self.stats.get('files_scanned', 0)}"
                    )
                    self.secrets_found_label.configure(
                        text=f"Secrets Found: {secrets_count}",
                        text_color="#E06C75" if secrets_count > 0 else "#98C379"
                    )
                    self.duration_label.configure(text=f"Duration: {duration}s")

                    if secrets_count > 0:
                        self.export_json_btn.configure(state="normal")
                        self.export_txt_btn.configure(state="normal")

                    self.render_findings(self.findings)

        except queue.Empty:
            pass
        finally:
            self.root.after(100, self._process_queue)

    def render_findings(self, findings_list: List[Dict[str, Any]]):
        for widget in self.scroll_results.winfo_children():
            widget.destroy()

        if not findings_list:
            self._show_empty_placeholder("No hardcoded secrets or credentials detected! Project is clean.")
            return

        for idx, finding in enumerate(findings_list):
            card = ctk.CTkFrame(self.scroll_results, fg_color="#21252B", corner_radius=8)
            card.pack(fill="x", padx=4, pady=4)
            card.grid_columnconfigure(1, weight=1)

            # Left badge
            badge = ctk.CTkLabel(
                card,
                text=" HIGH RISK ",
                font=ctk.CTkFont(size=10, weight="bold"),
                fg_color="#E06C75",
                text_color="#FFFFFF",
                corner_radius=4
            )
            badge.grid(row=0, column=0, padx=10, pady=10, sticky="w")

            # Main info
            info_frame = ctk.CTkFrame(card, fg_color="transparent")
            info_frame.grid(row=0, column=1, padx=8, pady=8, sticky="ew")

            rel_path = finding.get("filepath", "")
            if self.selected_dir and rel_path.startswith(self.selected_dir):
                rel_path = os.path.relpath(rel_path, self.selected_dir)

            title_str = f"[{finding.get('secret_type')}]  Line {finding.get('line_number')}"
            lbl_title = ctk.CTkLabel(
                info_frame,
                text=title_str,
                font=ctk.CTkFont(size=13, weight="bold"),
                text_color="#61AFEF"
            )
            lbl_title.pack(anchor="w")

            lbl_path = ctk.CTkLabel(
                info_frame,
                text=f"File: {rel_path}",
                font=ctk.CTkFont(size=11),
                text_color="#ABB2BF"
            )
            lbl_path.pack(anchor="w")

            masked_val = finding.get("masked_value", "****")
            lbl_masked = ctk.CTkLabel(
                info_frame,
                text=f"Detected Token: {masked_val}",
                font=ctk.CTkFont(size=12, family="Courier", weight="bold"),
                text_color="#E5C07B"
            )
            lbl_masked.pack(anchor="w", pady=(2, 0))

            # View Context Action
            view_btn = ctk.CTkButton(
                card,
                text="👁 Context",
                width=80,
                height=28,
                font=ctk.CTkFont(size=11),
                fg_color="#2B3245",
                hover_color="#3B445C",
                command=lambda f=finding: self.show_context_modal(f)
            )
            view_btn.grid(row=0, column=2, padx=12, pady=10)

    def filter_findings(self):
        query = self.search_entry.get().strip().lower()
        cat_filter = self.category_menu.get()

        filtered = []
        for f in self.findings:
            matches_query = (
                not query
                or query in f.get("filepath", "").lower()
                or query in f.get("secret_type", "").lower()
                or query in f.get("masked_value", "").lower()
            )
            matches_cat = (cat_filter == "All Categories" or f.get("secret_type") == cat_filter)

            if matches_query and matches_cat:
                filtered.append(f)

        self.render_findings(filtered)

    def show_context_modal(self, finding: Dict[str, Any]):
        modal = ctk.CTkToplevel(self.root)
        modal.title("Finding Code Context")
        modal.geometry("700x450")
        modal.grab_set()

        modal.grid_columnconfigure(0, weight=1)
        modal.grid_rowconfigure(1, weight=1)

        header = ctk.CTkLabel(
            modal,
            text=f"File: {finding.get('filepath')} (Line {finding.get('line_number')})",
            font=ctk.CTkFont(size=13, weight="bold"),
            text_color="#61AFEF"
        )
        header.grid(row=0, column=0, padx=16, pady=12, sticky="w")

        text_box = ctk.CTkTextbox(modal, font=ctk.CTkFont(family="Courier", size=12))
        text_box.grid(row=1, column=0, padx=16, pady=8, sticky="nsew")

        file_p = finding.get("filepath", "")
        line_no = finding.get("line_number", 1)

        try:
            with open(file_p, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
                start_l = max(0, line_no - 5)
                end_l = min(len(lines), line_no + 5)
                snippet = ""
                for i in range(start_l, end_l):
                    curr_num = i + 1
                    prefix = ">>> " if curr_num == line_no else "    "
                    snippet += f"{prefix}{curr_num:4d} | {lines[i]}"
                text_box.insert("1.0", snippet)
        except Exception as e:
            text_box.insert("1.0", f"Error reading file context: {str(e)}\n\nFull Line: {finding.get('full_line')}")

        close_btn = ctk.CTkButton(modal, text="Close", command=modal.destroy)
        close_btn.grid(row=2, column=0, padx=16, pady=12)

    def export_report(self, fmt: str):
        if not self.findings:
            return

        default_filename = f"keysentinel_report_{int(time.time())}.{fmt}"
        file_path = filedialog.asksaveasfilename(
            defaultextension=f".{fmt}",
            initialfile=default_filename,
            filetypes=[("JSON Files", "*.json")] if fmt == "json" else [("Text Files", "*.txt")]
        )
        if not file_path:
            return

        try:
            if fmt == "json":
                report_data = {
                    "tool": "KeySentinel Static Security Scanner",
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "project_directory": self.selected_dir,
                    "stats": self.stats,
                    "findings": self.findings,
                }
                with open(file_path, "w", encoding="utf-8") as f:
                    json.dump(report_data, f, indent=2)
            else:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write("====================================================\n")
                    f.write("       KEYSENTINEL STATIC SECURITY SCAN REPORT      \n")
                    f.write("====================================================\n")
                    f.write(f"Date: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
                    f.write(f"Project: {self.selected_dir}\n")
                    f.write(f"Files Scanned: {self.stats.get('files_scanned')}\n")
                    f.write(f"Secrets Detected: {self.stats.get('secrets_found')}\n")
                    f.write(f"Scan Duration: {self.stats.get('duration_seconds')}s\n")
                    f.write("----------------------------------------------------\n\n")

                    for idx, item in enumerate(self.findings, 1):
                        f.write(f"[{idx}] {item['secret_type']} (Line {item['line_number']})\n")
                        f.write(f"    File: {item['filepath']}\n")
                        f.write(f"    Masked Secret: {item['masked_value']}\n")
                        f.write(f"    Line Content: {item['full_line']}\n\n")

            messagebox.showinfo("Export Successful", f"Scan report saved to:\n{file_path}")
        except Exception as e:
            messagebox.showerror("Export Failed", f"Could not save report: {str(e)}")

    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    app = KeySentinelGUI()
    app.run()
