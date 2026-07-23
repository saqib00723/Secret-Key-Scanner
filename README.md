# KeySentinel

[![Python](https://img.shields.io/badge/Python-3.8%2B-blue?logo=python&logoColor=white)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Security](https://img.shields.io/badge/Security-Scanner-red?logo=shield&logoColor=white)](https://github.com/saqib00723/Secret-Key-Scanner)

KeySentinel is a fast, lightweight, static security analysis tool written in Python. It scans local project directories for hardcoded API keys, passwords, database connection credentials, tokens, and private keys before code gets committed or pushed. Designed for developers and DevSecOps teams to prevent sensitive data leaks at the source.

---

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Detection Patterns](#detection-patterns)
- [Project Architecture](#project-architecture)
- [Configuration](#configuration)
- [Security Remediation](#security-remediation)
- [Use Cases](#use-cases)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [Author](#author)
- [License](#license)

---

## Features

- **Static Secret Analysis** - Scans codebase line-by-line using optimized regular expressions
- **Asynchronous & Responsive** - Uses multithreading so the GUI never freezes during large scans
- **Masked Previews** - Automatically masks secrets (`sk-proj-****1234`) to prevent sensitive leaks in logs and UI
- **14+ Key Categories** - Detects AWS Access/Secret Keys, OpenAI Keys, GitHub Tokens, Slack Tokens & Webhooks, Stripe Keys, Google API Keys, Database URLs, JWTs, RSA Keys, and Generic Passwords
- **Export Reports** - Save findings in structured JSON or clean Text format for CI/CD integration or audit records
- **Smart Exclusion** - Ignores binary files, large files (>5MB), and common non-code directories (`.git`, `node_modules`, `__pycache__`, `.venv`)
- **Modern GUI** - Dark-themed desktop application built with CustomTkinter
- **CLI Support** - Command-line interface for headless systems and CI/CD pipelines
- **Web Interface** - React-based web dashboard for browser-based scanning

---

## Demo

Try the web interface or download the desktop application to scan your projects locally.

```bash
# Clone the repository
git clone https://github.com/saqib00723/Secret-Key-Scanner.git

# Navigate to project directory
cd Secret-Key-Scanner

# Install dependencies and run
pip install -r requirements.txt
python main.py
```

---

## Installation

### Prerequisites

- Python 3.8 or higher
- Node.js 16+ (for web interface only)

### Desktop Application

```bash
# Clone the repository
git clone https://github.com/saqib00723/Secret-Key-Scanner.git

# Navigate to project directory
cd Secret-Key-Scanner

# Install Python dependencies
pip install -r requirements.txt
```

### Web Interface

```bash
# Install Node.js dependencies
npm install

# Start development server
npm run dev
```

The web interface will be available at `http://localhost:3000`

---

## Quick Start

### Option 1: Desktop GUI Application

```bash
python main.py
```

Launches the graphical interface where you can:
- Select a project directory to scan
- View real-time scanning progress
- Inspect detected secrets with context
- Export reports in JSON or TXT format

### Option 2: Command Line Interface

For headless systems or automated scans:

```bash
# Human-readable CLI summary
python scanner.py /path/to/project

# JSON output for CI/CD pipelines
python scanner.py /path/to/project --json
```

### Option 3: Web Interface

```bash
# Start the web server
npm run dev

# Open browser to http://localhost:3000
```

---

## Usage

### GUI Application

1. Launch the application with `python main.py`
2. Click "Select Project Folder" to choose a directory
3. Click "Start Scan" to begin analysis
4. Review findings in the results panel
5. Click "View Context" to see code surrounding each finding
6. Export results using the JSON or TXT buttons

### CLI Usage

```bash
# Basic scan with human-readable output
python scanner.py ./my-project

# JSON output for automation
python scanner.py ./my-project --json > results.json

# Scan current directory
python scanner.py . --json
```

### Web Interface

1. Navigate to `http://localhost:3000` in your browser
2. Choose from three scan modes:
   - **Upload File**: Upload a single file for analysis
   - **Folder/Path**: Specify a directory path on the server
   - **Paste Code**: Paste code snippets directly in the browser
3. Click "Start Scan" to analyze
4. View results in the interactive table
5. Click "View" to inspect code context for each finding

---

## Detection Patterns

KeySentinel detects the following types of secrets and credentials:

| Category | Pattern Example | Description |
|----------|-----------------|-------------|
| AWS Access Key | `AKIA...` | AWS Access Key ID |
| AWS Secret Key | 40-character string | AWS Secret Access Key |
| OpenAI API Key | `sk-...` | OpenAI API tokens |
| GitHub Token | `ghp_...`, `gho_...` | GitHub Personal/OAuth tokens |
| Slack Token | `xoxb-...`, `xoxp-...` | Slack Bot/User tokens |
| Slack Webhook | `https://hooks.slack.com/...` | Slack webhook URLs |
| Stripe Key | `sk_live_...`, `sk_test_...` | Stripe API keys |
| Google API Key | `AIza...` | Google API keys |
| Generic API Key | Various patterns | Generic API key patterns |
| Database URL | `postgres://...`, `mysql://...` | Database connection strings |
| JWT Token | `eyJ...` | JSON Web Tokens |
| RSA Private Key | `-----BEGIN RSA PRIVATE KEY-----` | RSA private keys |
| Generic Password | `password=...` | Hardcoded passwords |

---

## Project Architecture

```
Secret-Key-Scanner/
├── patterns.py          # Compiled regex patterns and ignore lists
├── scanner.py           # Core SecretScanner class with scanning logic
├── gui.py               # CustomTkinter desktop GUI application
├── main.py              # Entry point for desktop application
├── server.ts            # Express server for web interface
├── src/                 # React frontend source code
│   ├── App.tsx          # Main React application component
│   ├── components/      # React UI components
│   │   ├── Header.tsx
│   │   ├── ScannerDashboard.tsx
│   │   ├── PatternsView.tsx
│   │   ├── RemediationGuide.tsx
│   │   └── ...
│   └── types.ts         # TypeScript type definitions
├── samples/             # Sample vulnerable applications for testing
│   ├── vulnerable_app/  # Contains various leaked credentials
│   ├── flask_api/       # Python API with Stripe/RSA keys
│   └── clean_microservice/  # Clean code example
├── requirements.txt     # Python dependencies
├── package.json         # Node.js dependencies
└── README.md            # This file
```

### Core Components

**patterns.py**
- Contains compiled regex patterns for 14+ secret types
- Defines default ignore lists for directories and file extensions
- Configurable pattern registry

**scanner.py**
- `SecretScanner` class implementing core scanning logic
- File system traversal with smart exclusions
- Line-by-line regex matching
- Secret masking for safe display
- JSON and CLI output formatters

**gui.py**
- Modern dark-themed CustomTkinter interface
- Real-time progress tracking
- Scrollable results with filtering
- Context inspector modal for viewing surrounding code
- Export functionality for JSON and TXT reports

**server.ts**
- Express.js backend for web interface
- API endpoints for scanning, file context, and downloads
- Integration with Python scanner via subprocess
- ZIP bundle generation for desktop app download

---

## Configuration

KeySentinel works out-of-the-box with sensible defaults but supports customization:

### Custom Patterns

Add custom regex patterns in `patterns.py`:

```python
SECRET_PATTERNS['MY_CUSTOM_KEY'] = re.compile(r'my-api-key-[a-zA-Z0-9]{32}')
```

### File Exclusions

Modify ignore lists in `patterns.py`:

```python
DEFAULT_IGNORE_DIRS = {'.git', 'node_modules', '__pycache__', '.venv', 'dist', 'build'}
DEFAULT_IGNORE_EXTENSIONS = {'.pyc', '.exe', '.dll', '.so', '.dylib', '.png', '.jpg'}
```

### Scan Settings

Adjust scanner behavior in `scanner.py`:

- **Max file size**: Currently 5MB (modifiable in `should_scan_file()`)
- **Thread count**: Configurable for parallel scanning
- **Context lines**: Number of lines shown before/after findings

---

## Security Remediation

When KeySentinel flags a secret in your repository:

### Immediate Actions

1. **Revoke/Rotate Immediately** - Assume any hardcoded credential in source control is compromised. Rotate the key in the provider console (AWS, OpenAI, GitHub, Stripe, etc.)

2. **Remove from Git History** - Use tools like `git filter-branch` or `BFG Repo-Cleaner` to remove secrets from commit history

3. **Check Access Logs** - Review provider logs for unauthorized usage during the exposure period

### Prevention Measures

1. **Use Environment Variables** - Store credentials in `.env` files

```python
# Python
import os
api_key = os.getenv("SECRET_NAME")
```

```javascript
// Node.js
const apiKey = process.env.SECRET_NAME;
```

2. **Add to .gitignore**

```gitignore
.env
.env.local
.env.*.local
credentials.json
*.pem
*.key
```

3. **Use Secret Managers** - For production environments:
   - AWS Secrets Manager
   - HashiCorp Vault
   - Google Cloud Secret Manager
   - Azure Key Vault

4. **Implement Pre-commit Hooks** - Integrate KeySentinel into your Git workflow:

```bash
# .git/hooks/pre-commit
#!/bin/sh
python /path/to/scanner.py . --json || exit 1
```

---

## Use Cases

- **Pre-commit Hooks** - Catch secrets before they reach your repository
- **CI/CD Pipelines** - Automate security scanning as part of your build process
- **Code Reviews** - Quickly identify potential credential exposures during peer reviews
- **Security Audits** - Generate compliance reports for security assessments
- **Repository Scanning** - Scan existing codebases for accidental credential exposure
- **Onboarding** - Verify new team members don't commit sensitive data
- **Third-party Code Review** - Check vendor code before integration

---

## Screenshots

### Desktop GUI Application

The desktop application provides a clean, dark-themed interface for local scanning with real-time progress, filtering, and export capabilities.

### Web Interface

The React-based web interface offers three scan modes: file upload, directory path, and code paste, making it accessible from any browser.

---

## API Reference

### REST API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/samples` | GET | List sample projects for testing |
| `/api/scan` | POST | Run secret scan on directory or files |
| `/api/file-context` | POST | Get code context for a specific finding |
| `/api/python-files` | GET | Retrieve source code files |
| `/api/download-zip` | GET | Download desktop app as ZIP bundle |

### Scan Request Examples

```bash
# Scan a directory
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"targetPath": "/path/to/project"}'

# Scan uploaded code
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"customFiles": [{"path": "app.py", "content": "API_KEY=..."}]}'
```

---

## Contributing

Contributions, issues, and feature requests are welcome. Feel free to submit a Pull Request.

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/Secret-Key-Scanner.git

# Create a feature branch
git checkout -b feature/amazing-feature

# Make your changes and commit
git commit -m "Add amazing feature"

# Push to your fork
git push origin feature/amazing-feature

# Open a Pull Request
```

### Guidelines

- Follow the existing code style
- Add tests for new detection patterns
- Update documentation for API changes
- Ensure backward compatibility

---

## Author

**Saqib**

- GitHub: [@saqib00723](https://github.com/saqib00723)
- Repository: [Secret-Key-Scanner](https://github.com/saqib00723/Secret-Key-Scanner)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built with Python, CustomTkinter, React, and Express
- Inspired by the need for developer-friendly security tools
- Thanks to the open-source community for pattern contributions

---

## Support

If this project helped you secure your codebase, please consider giving it a star on GitHub. It helps others discover the tool and motivates continued development.

For issues, feature requests, or questions, please open an issue on the [GitHub repository](https://github.com/saqib00723/Secret-Key-Scanner/issues).
