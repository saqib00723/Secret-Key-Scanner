export interface Finding {
  filepath: string;
  line_number: number;
  secret_type: string;
  masked_value: string;
  full_line: string;
  match_start: number;
  match_end: number;
}

export interface ScanStats {
  files_scanned: number;
  total_files: number;
  secrets_found: number;
  duration_seconds: number;
}

export interface ScanResult {
  root_directory?: string;
  findings: Finding[];
  stats: ScanStats;
  error?: string;
}

export interface SampleRepo {
  id: string;
  name: string;
  description: string;
  path: string;
}

export interface SnippetLine {
  lineNum: number;
  text: string;
  isTarget: boolean;
}

export interface FileContextResponse {
  filepath: string;
  targetLine: number;
  totalLines: number;
  snippet: SnippetLine[];
}

export interface CustomFile {
  path: string;
  content: string;
}

export type TabType = 'dashboard' | 'patterns' | 'python-code' | 'playground' | 'guide';
