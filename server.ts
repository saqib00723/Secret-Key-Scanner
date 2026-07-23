import express from 'express';
import path from 'path';
import fs from 'fs';
import { exec, execSync } from 'child_process';
import { createServer as createViteServer } from 'vite';
import AdmZip from 'adm-zip';

function getPythonCmd(): string {
  const candidates = process.platform === 'win32'
    ? ['python', 'py', 'python3']
    : ['python3', 'python', 'py'];

  for (const cmd of candidates) {
    try {
      execSync(`${cmd} --version`, { stdio: 'ignore' });
      return cmd;
    } catch {
      // ignore
    }
  }
  return process.platform === 'win32' ? 'python' : 'python3';
}

const pythonCmd = getPythonCmd();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API 1: List Sample Projects
  app.get('/api/samples', (req, res) => {
    const samples = [
      {
        id: 'vulnerable_app',
        name: 'Vulnerable App (Multiple Leaked Keys)',
        description: 'Contains hardcoded AWS keys, OpenAI token, Slack webhook, DB credentials & JWTs.',
        path: path.join(process.cwd(), 'samples', 'vulnerable_app')
      },
      {
        id: 'flask_api',
        name: 'Python Flask API (Stripe Key & RSA Private Key)',
        description: 'Contains hardcoded Stripe live API key and inline RSA private key header.',
        path: path.join(process.cwd(), 'samples', 'flask_api')
      },
      {
        id: 'clean_microservice',
        name: 'Clean Express Microservice',
        description: 'Clean Node.js service using process.env with no hardcoded credentials.',
        path: path.join(process.cwd(), 'samples', 'clean_microservice')
      },
      {
        id: 'keysentinel_self',
        name: 'KeySentinel Repository (Self-Scan)',
        description: 'The KeySentinel project files themselves.',
        path: process.cwd()
      }
    ];
    res.json({ samples });
  });

  // API 2: Run Secret Scan on a Directory or Custom Code Files
  app.post('/api/scan', (req, res) => {
    const { targetPath, customFiles } = req.body;

    // If custom text/file scan requested (in-browser code snippet scan)
    if (customFiles && Array.isArray(customFiles) && customFiles.length > 0) {
      const tempScanDir = path.join(process.cwd(), '.tmp_scans', `scan_${Date.now()}`);
      fs.mkdirSync(tempScanDir, { recursive: true });

      try {
        customFiles.forEach((file: { path: string; content: string }) => {
          const safeRelPath = file.path.replace(/^\/+/, '');
          const fullFilePath = path.join(tempScanDir, safeRelPath);
          fs.mkdirSync(path.dirname(fullFilePath), { recursive: true });
          fs.writeFileSync(fullFilePath, file.content || '', 'utf-8');
        });

        exec(`${pythonCmd} scanner.py "${tempScanDir}" --json`, (error, stdout, stderr) => {
          // Clean up temp folder
          try {
            fs.rmSync(tempScanDir, { recursive: true, force: true });
          } catch (e) {}

          if (error && !stdout) {
            return res.status(500).json({ error: `Scanner error: ${stderr || error.message}` });
          }

          try {
            const parsed = JSON.parse(stdout);
            // Replace temp dir path in findings with relative custom file names
            if (parsed.findings) {
              parsed.findings = parsed.findings.map((f: any) => ({
                ...f,
                filepath: f.filepath.replace(tempScanDir, '').replace(/^[\/\\]/, '')
              }));
            }
            res.json(parsed);
          } catch (parseErr) {
            res.status(500).json({ error: 'Failed to parse scanner JSON output' });
          }
        });
      } catch (err: any) {
        res.status(500).json({ error: `Failed to prepare custom scan: ${err.message}` });
      }
      return;
    }

    // Standard directory scan via Python scanner
    const resolvedPath = targetPath ? path.resolve(targetPath) : process.cwd();

    if (!fs.existsSync(resolvedPath)) {
      return res.status(400).json({ error: `Directory path does not exist: ${resolvedPath}` });
    }

    exec(`${pythonCmd} scanner.py "${resolvedPath}" --json`, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error && !stdout) {
        return res.status(500).json({ error: `Scan failed: ${stderr || error.message}` });
      }

      try {
        const results = JSON.parse(stdout);
        res.json(results);
      } catch (parseErr) {
        res.status(500).json({ error: 'Failed to parse scanner output', raw: stdout });
      }
    });
  });

  // API 3: Get Python Source Files for KeySentinel
  app.get('/api/python-files', (req, res) => {
    const filesToRead = ['patterns.py', 'scanner.py', 'gui.py', 'main.py', 'requirements.txt', 'README.md'];
    const filesData: Record<string, string> = {};

    filesToRead.forEach((filename) => {
      const fullPath = path.join(process.cwd(), filename);
      if (fs.existsSync(fullPath)) {
        filesData[filename] = fs.readFileSync(fullPath, 'utf-8');
      } else {
        filesData[filename] = `# File ${filename} not found`;
      }
    });

    res.json({ files: filesData });
  });

  // API 4: Get Code Context for Line Inspector
  app.post('/api/file-context', (req, res) => {
    const { filepath, lineNumber } = req.body;
    if (!filepath || !fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    try {
      const content = fs.readFileSync(filepath, 'utf-8');
      const lines = content.split('\n');
      const targetLine = parseInt(lineNumber, 10) || 1;

      const startLine = Math.max(0, targetLine - 6);
      const endLine = Math.min(lines.length, targetLine + 5);

      const snippet = lines.slice(startLine, endLine).map((text, idx) => ({
        lineNum: startLine + idx + 1,
        text,
        isTarget: startLine + idx + 1 === targetLine
      }));

      res.json({
        filepath,
        targetLine,
        totalLines: lines.length,
        snippet
      });
    } catch (e: any) {
      res.status(500).json({ error: `Failed to read file context: ${e.message}` });
    }
  });

  // API 5: Download KeySentinel Zip Bundle
  app.get('/api/download-zip', (req, res) => {
    try {
      const zip = new AdmZip();
      const filesToZip = ['patterns.py', 'scanner.py', 'gui.py', 'main.py', 'requirements.txt', 'README.md'];

      filesToZip.forEach((filename) => {
        const fullPath = path.join(process.cwd(), filename);
        if (fs.existsSync(fullPath)) {
          zip.addLocalFile(fullPath);
        }
      });

      const buffer = zip.toBuffer();
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="KeySentinel_Desktop_App.zip"');
      res.send(buffer);
    } catch (err: any) {
      res.status(500).json({ error: `Failed to generate zip: ${err.message}` });
    }
  });

  // Vite Middleware integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KeySentinel Full-Stack Server running on http://localhost:${PORT}`);
  });
}

startServer();
