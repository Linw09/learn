#!/usr/bin/env node
/**
 * daily-report 素材采集器
 *
 * 只做确定性的取证：把「某一天某个项目的 git 提交 + 当天 OpenCode 会话」
 * 汇总成一份 JSON，交给模型去组织语言。
 *
 * 用法：
 *   node --no-warnings collect.mjs [--date YYYY-MM-DD] [--project <路径>]
 *                                  [--out <输出文件>] [--history-days 7]
 *
 * 不传 --project 时按以下顺序推断项目：
 *   1. 当前工作目录（若是 git 仓库）
 *   2. 当天 OpenCode 会话的 directory，优先当天有提交的目录
 *   3. 最近 7 天会话的 directory
 *
 * 输出同时写到 stdout 和 --out（UTF-8）。Windows 控制台会乱码，
 * 因此 skill 里应始终带 --out，然后直接读文件。
 */

import { DatabaseSync } from 'node:sqlite';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// ---------- 参数 ----------

const argv = process.argv.slice(2);
function argOf(name, fallback) {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = argv[i + 1];
  if (!v || v.startsWith('--')) throw new Error(`参数 --${name} 缺少值`);
  return v;
}

const dateStr = argOf('date', formatDate(new Date()));
const projectArg = argOf('project', null);
const outFile = argOf('out', null);
const historyDays = Number(argOf('history-days', '7'));

if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
  throw new Error(`--date 格式应为 YYYY-MM-DD，收到：${dateStr}`);
}

const dayStart = parseLocalDate(dateStr);
const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000);

function formatDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function parseLocalDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function formatDateTime(ms) {
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${formatDate(d)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ---------- 配置：谁的提交算「我做的」 ----------

function loadConfig() {
  const skillDir = path.join(import.meta.dirname, '..');
  const file = path.join(skillDir, 'config.json');
  const defaultHistory = path.join(skillDir, 'history');
  const empty = {
    authors: [],
    emails: [],
    svnAuthors: [],
    configured: false,
    svnConfigured: false,
    historyDir: defaultHistory,
    file,
  };
  if (!fs.existsSync(file)) return empty;
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    const authors = (raw.gitAuthors || []).map((s) => String(s).toLowerCase());
    const emails = (raw.gitEmails || []).map((s) => String(s).toLowerCase());
    const svnAuthors = (raw.svnAuthors || []).map((s) => String(s).toLowerCase());
    // historyDir 支持绝对路径和相对 skill 目录的路径
    const historyDir = raw.historyDir ? path.resolve(skillDir, raw.historyDir) : defaultHistory;
    return {
      authors,
      emails,
      svnAuthors,
      configured: authors.length > 0 || emails.length > 0,
      svnConfigured: svnAuthors.length > 0,
      historyDir,
      file,
    };
  } catch (e) {
    return {
      ...empty,
      error: String(e && e.message ? e.message : e),
    };
  }
}

const CONFIG = loadConfig();

/** 未配置时返回 null（由模型提示用户配置），已配置则返回布尔 */
function isMineCommit(commit) {
  if (!CONFIG.configured) return null;
  const name = String(commit.author || '').toLowerCase();
  const email = String(commit.email || '').toLowerCase();
  return CONFIG.authors.includes(name) || CONFIG.emails.includes(email);
}

// ---------- OpenCode 会话库 ----------

/** opencode 数据目录：优先环境变量，其余按平台默认值 */
function opencodeDbPath() {
  const candidates = [];
  if (process.env.OPENCODE_DATA_DIR) {
    candidates.push(path.join(process.env.OPENCODE_DATA_DIR, 'opencode.db'));
  }
  candidates.push(path.join(os.homedir(), '.local', 'share', 'opencode', 'opencode.db'));
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    candidates.push(path.join(process.env.LOCALAPPDATA, 'opencode', 'opencode.db'));
  }
  return candidates.find((p) => fs.existsSync(p)) || null;
}

function querySessions() {
  const dbFile = opencodeDbPath();
  if (!dbFile) return { dbFile: null, sessions: [], prompts: [], weekDirs: [] };

  const db = new DatabaseSync(dbFile, { readOnly: true });
  try {
    // 跨天会话：创建时间早于今天、但今天仍有更新，也要算进来
    const sessions = db.prepare(`
      select s.id, s.title, s.directory, s.time_created, s.time_updated,
             s.summary_additions, s.summary_deletions, s.summary_files
      from session_v2 s
      where s.parent_id is null
        and s.time_updated >= ? and s.time_created < ?
      order by s.time_created
    `).all(dayStart.getTime(), dayEnd.getTime());

    // 只取主会话的提问，子会话（subagent）的转发 prompt 不算用户输入
    const prompts = db.prepare(`
      select m.session_id, m.time_created, json_extract(m.data, '$.text') as text
      from session_message m
      join session_v2 s on s.id = m.session_id
      where s.parent_id is null
        and m.type = 'user'
        and m.time_created >= ? and m.time_created < ?
      order by m.time_created
    `).all(dayStart.getTime(), dayEnd.getTime());

    // 当天没有会话时，用最近 7 天的目录兜底推断项目
    const weekStart = dayStart.getTime() - 7 * 24 * 3600 * 1000;
    const weekDirs = db.prepare(`
      select directory, count(*) as n
      from session_v2
      where parent_id is null and time_updated >= ?
      group by directory
      order by n desc
      limit 10
    `).all(weekStart);

    return { dbFile, sessions, prompts, weekDirs };
  } finally {
    db.close();
  }
}

// ---------- git ----------

function git(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 32 * 1024 * 1024,
  });
}

function isGitRepo(dir) {
  try {
    git(['rev-parse', '--is-inside-work-tree'], dir);
    return true;
  } catch {
    return false;
  }
}

function gitCommitCount(dir) {
  try {
    const out = git([
      'log',
      `--since=${dateStr} 00:00:00`,
      `--until=${dateStr} 23:59:59`,
      '--oneline',
    ], dir);
    return out.split(/\r?\n/).filter(Boolean).length;
  } catch {
    return 0;
  }
}

/** 路径 → 模块名：modules/x/y 取前两段，其余取第一段 */
function topModule(file) {
  const parts = file.split('/');
  if (parts.length >= 2 && parts[0] === 'modules') return parts.slice(0, 2).join('/');
  return parts[0];
}

/**
 * 单条提交的细节：正文、增删行数、变更位置的方法签名、新增的接口路径/字段名。
 * 这些是日报写出「深度」的原料——没有它们，模型只能拿"梳理/复核"凑句子。
 */
function readCommitDetail(dir, hash, fileCount) {
  const detail = { body: '', numstat: [], hunks: [], addedKeys: [] };

  try {
    detail.body = git(['show', '-s', '--format=%b', hash], dir).trim();
  } catch {
    // 没有正文就留空
  }

  try {
    const ns = git(['show', '--numstat', '--format=', hash], dir);
    for (const line of ns.split(/\r?\n/)) {
      const m = line.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
      if (!m) continue;
      detail.numstat.push({
        added: m[1] === '-' ? 0 : Number(m[1]),
        deleted: m[2] === '-' ? 0 : Number(m[2]),
        file: m[3],
      });
    }
  } catch {
    // numstat 失败不影响主流程
  }

  // 大提交的 diff 可能几 MB，只对中小提交提取，避免拖慢采集
  if (fileCount <= 30) {
    let diff = '';
    try {
      diff = git(['show', '--format=', '--unified=0', '--no-color', hash], dir);
    } catch {
      return detail;
    }

    // @@ 头后面的上下文就是被改动的方法签名 / 组件区块名
    for (const line of diff.split(/\r?\n/)) {
      if (!line.startsWith('@@')) continue;
      const m = line.match(/^@@[^@]*@@\s*(.*)$/);
      if (m && m[1].trim()) detail.hunks.push(m[1].trim().slice(0, 160));
    }
    detail.hunks = [...new Set(detail.hunks)].slice(0, 20);

    // 新增行里的字符串字面量：接口路径、字段名、字典 key 大多在这里
    const keys = new Set();
    for (const line of diff.split(/\r?\n/)) {
      if (!line.startsWith('+') || line.startsWith('+++')) continue;
      for (const m of line.matchAll(/['"`]([A-Za-z0-9_./:-]{4,80})['"`]/g)) keys.add(m[1]);
    }
    detail.addedKeys = [...keys].slice(0, 30);
  }

  return detail;
}

function readCommits(dir) {
  const SEP = '\x1f';
  const out = git([
    'log',
    `--since=${dateStr} 00:00:00`,
    `--until=${dateStr} 23:59:59`,
    `--date=format:%Y-%m-%d %H:%M`,
    `--pretty=format:__C__%h${SEP}%ad${SEP}%an${SEP}%ae${SEP}%s`,
    '--name-only',
  ], dir);

  const commits = [];
  let cur = null;
  for (const rawLine of out.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('__C__')) {
      const [shortHash, date, author, email, subject] = line.slice(5).split(SEP);
      cur = { shortHash, date, author, email, subject, files: [] };
      commits.push(cur);
    } else if (cur) {
      cur.files.push(line);
    }
  }

  for (const c of commits) {
    c.fileCount = c.files.length;
    c.modules = [...new Set(c.files.map(topModule))];
    Object.assign(c, readCommitDetail(dir, c.shortHash, c.fileCount));
    // 单条提交最多保留 30 个文件，避免 JSON 过大
    c.files = c.files.slice(0, 30);
  }
  return commits;
}

function readUncommitted(dir) {
  let out = '';
  try {
    out = git(['status', '--short'], dir);
  } catch {
    return { modified: [], staged: [], untracked: [], total: 0 };
  }
  const modified = [];
  const staged = [];
  const untracked = [];
  for (const line of out.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const code = line.slice(0, 2);
    const file = line.slice(3).trim();
    if (code === '??') untracked.push(file);
    else if (code[0] !== ' ') staged.push(file);
    else modified.push(file);
  }
  return {
    modified: modified.slice(0, 40),
    staged: staged.slice(0, 40),
    untracked: untracked.slice(0, 40),
    total: modified.length + staged.length + untracked.length,
  };
}

function collectGit(dir) {
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], dir).trim();
  let userName = '';
  let userEmail = '';
  try {
    userName = git(['config', 'user.name'], dir).trim();
    userEmail = git(['config', 'user.email'], dir).trim();
  } catch {
    userName = '';
    userEmail = '';
  }
  return {
    branch,
    userName,
    userEmail,
    commits: readCommits(dir).map((c) => ({ ...c, isMine: isMineCommit(c) })),
    uncommitted: readUncommitted(dir),
  };
}

// ---------- SVN ----------

const SVN_AVAILABLE = (() => {
  try {
    execFileSync('svn', ['--version', '--quiet'], { stdio: 'ignore', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
})();

/** 从目录向上找 .svn，判断是否是 SVN 工作副本 */
function isSvnRepo(dir) {
  let cur = path.resolve(dir);
  for (let i = 0; i < 40; i++) {
    if (fs.existsSync(path.join(cur, '.svn'))) return true;
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return false;
}

function decodeXml(s) {
  return String(s)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** 次日日期字符串，用于构造 svn 的 -r {start}:{end} 范围 */
function nextDateStr(s) {
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d + 1);
  const p = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}

/** 当天修改过的文件，仅在 svn 命令行工具缺失时作为降级证据 */
function recentFiles(dir, limit = 40, maxScan = 30000) {
  const skip = new Set(['.svn', '.git', 'node_modules', 'target', 'dist', 'build', '.idea', '.vscode']);
  const found = [];
  let scanned = 0;
  const walk = (d) => {
    if (scanned >= maxScan || found.length >= limit * 4) return;
    let entries;
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (scanned >= maxScan || found.length >= limit * 4) return;
      const full = path.join(d, e.name);
      if (e.isDirectory()) {
        if (!skip.has(e.name)) walk(full);
      } else {
        scanned++;
        try {
          const st = fs.statSync(full);
          if (st.mtimeMs >= dayStart.getTime() && st.mtimeMs < dayEnd.getTime()) {
            found.push({ file: path.relative(dir, full).replace(/\\/g, '/'), mtime: st.mtimeMs });
          }
        } catch {
          // 权限不足的文件直接跳过
        }
      }
    }
  };
  walk(dir);
  return found.sort((a, b) => b.mtime - a.mtime).slice(0, limit);
}

function parseSvnLog(xml) {
  const commits = [];
  const entryRe = /<logentry\s+revision="(\d+)"[^>]*>([\s\S]*?)<\/logentry>/g;
  let m;
  while ((m = entryRe.exec(xml))) {
    const body = m[2];
    const author = (body.match(/<author>([\s\S]*?)<\/author>/) || [])[1] || '';
    const date = (body.match(/<date>([\s\S]*?)<\/date>/) || [])[1] || '';
    const msg = (body.match(/<msg>([\s\S]*?)<\/msg>/) || [])[1] || '';
    const files = [];
    const pathRe = /<path[^>]*action="[A-Z]+"[^>]*>([\s\S]*?)<\/path>/g;
    let p;
    while ((p = pathRe.exec(body))) files.push(decodeXml(p[1]).trim());
    commits.push({
      revision: m[1],
      author: decodeXml(author).trim(),
      date: date.trim(),
      subject: decodeXml(msg).trim().split(/\r?\n/)[0],
      files,
    });
  }
  return commits;
}

function svnCommitCount(dir) {
  if (!SVN_AVAILABLE) return 0;
  try {
    const xml = execFileSync('svn', ['log', '--xml', '-r', `{${dateStr}}:{${nextDateStr(dateStr)}}`, dir], {
      encoding: 'utf8',
      timeout: 8000,
      maxBuffer: 16 * 1024 * 1024,
    });
    return parseSvnLog(xml).filter((c) => {
      const t = Date.parse(c.date);
      return t >= dayStart.getTime() && t < dayEnd.getTime();
    }).length;
  } catch {
    return 0;
  }
}

function collectSvn(dir) {
  const result = {
    available: SVN_AVAILABLE,
    url: null,
    commits: [],
    uncommitted: null,
    recentFiles: [],
    error: null,
  };

  if (!SVN_AVAILABLE) {
    result.error = 'svn 命令不可用（TortoiseSVN 默认不安装命令行工具），读不到提交历史；已用当天修改过的文件作为降级证据';
    result.recentFiles = recentFiles(dir);
    return result;
  }

  try {
    const info = execFileSync('svn', ['info', '--xml', dir], { encoding: 'utf8', timeout: 15000 });
    const url = info.match(/<url>([\s\S]*?)<\/url>/);
    result.url = url ? decodeXml(url[1]).trim() : null;
  } catch (e) {
    result.error = `svn info 失败：${e && e.message ? e.message : e}`;
  }

  try {
    const xml = execFileSync('svn', ['log', '--xml', '-v', '-r', `{${dateStr}}:{${nextDateStr(dateStr)}}`, dir], {
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 32 * 1024 * 1024,
    });
    result.commits = parseSvnLog(xml)
      .filter((c) => {
        const t = Date.parse(c.date);
        return t >= dayStart.getTime() && t < dayEnd.getTime();
      })
      .map((c) => {
        const files = c.files.map((f) => f.replace(/^\//, ''));
        return {
          ...c,
          files: files.slice(0, 30),
          fileCount: files.length,
          modules: [...new Set(files.map(topModule))],
          isMine: CONFIG.svnConfigured
            ? CONFIG.svnAuthors.includes(c.author.toLowerCase())
            : null,
        };
      });
  } catch (e) {
    result.error = [result.error, `svn log 失败：${e && e.message ? e.message : e}`]
      .filter(Boolean)
      .join('；');
  }

  try {
    const status = execFileSync('svn', ['status', dir], {
      encoding: 'utf8',
      timeout: 20000,
      maxBuffer: 16 * 1024 * 1024,
    });
    const modified = [];
    const added = [];
    const untracked = [];
    for (const line of status.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const code = line.slice(0, 1);
      const file = line.slice(8).trim();
      if (code === '?') untracked.push(file);
      else if (code === 'A') added.push(file);
      else modified.push(file);
    }
    result.uncommitted = {
      modified: modified.slice(0, 40),
      added: added.slice(0, 40),
      untracked: untracked.slice(0, 40),
      total: modified.length + added.length + untracked.length,
    };
  } catch (e) {
    result.error = [result.error, `svn status 失败：${e && e.message ? e.message : e}`]
      .filter(Boolean)
      .join('；');
  }

  return result;
}

function vcsOf(p) {
  if (!p) return 'none';
  if (p.isGit && p.isSvn) return 'both';
  if (p.isGit) return 'git';
  if (p.isSvn) return 'svn';
  return 'none';
}

// ---------- 项目推断 ----------

/** 统一路径写法，避免 C:/x 与 C:\x 被当成两个目录 */
function normDir(p) {
  if (!p) return p;
  return path.resolve(p).replace(/\\/g, '/');
}

function countBy(dirs) {
  const m = new Map();
  for (const d of dirs) {
    if (!d) continue;
    m.set(d, (m.get(d) || 0) + 1);
  }
  return m;
}

function inferProject(sessions, weekDirs) {
  const candidates = [];
  const seen = new Set();

  const push = (directory, sessionsCount) => {
    if (!directory) return;
    const dir = normDir(directory);
    if (seen.has(dir)) {
      const existing = candidates.find((c) => c.directory === dir);
      if (existing) existing.sessions += sessionsCount;
      return;
    }
    seen.add(dir);
    const okGit = isGitRepo(dir);
    const okSvn = isSvnRepo(dir);
    candidates.push({
      directory: dir,
      sessions: sessionsCount,
      isGit: okGit,
      isSvn: okSvn,
      commits: okGit ? gitCommitCount(dir) : 0,
      svnCommits: 0,
    });
  };

  push(process.cwd(), 0);
  for (const [dir, n] of countBy(sessions.map((s) => s.directory))) push(dir, n);
  for (const row of weekDirs) push(row.directory, 0);

  // svn log 要连服务器，只对前 3 个 svn 候选查，避免整体卡死
  let svnChecked = 0;
  for (const c of candidates) {
    if (c.isSvn && svnChecked < 3) {
      c.svnCommits = svnCommitCount(c.directory);
      svnChecked++;
    }
  }

  // 当天有提交的仓库优先，其次任意版本库，最后任意目录
  const totalCommits = (c) => c.commits + c.svnCommits;
  candidates.sort((a, b) => {
    if (totalCommits(b) !== totalCommits(a)) return totalCommits(b) - totalCommits(a);
    if (a.isGit !== b.isGit) return a.isGit ? -1 : 1;
    if (a.isSvn !== b.isSvn) return a.isSvn ? -1 : 1;
    return b.sessions - a.sessions;
  });

  const chosen = candidates.find((c) => totalCommits(c) > 0)
    || candidates.find((c) => c.isGit || c.isSvn)
    || candidates[0]
    || null;

  return { candidates, chosen };
}

// ---------- 历史日报 ----------

function readHistory() {
  const dir = CONFIG.historyDir;
  if (!fs.existsSync(dir)) return [];

  const from = dayStart.getTime() - historyDays * 24 * 3600 * 1000;
  const items = [];
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.md')) continue;
    const text = fs.readFileSync(path.join(dir, name), 'utf8');
    // 按 "## YYYY-MM-DD" 切段
    const re = /^##\s+(\d{4}-\d{2}-\d{2})\s*$/gm;
    const marks = [...text.matchAll(re)];
    for (let i = 0; i < marks.length; i++) {
      const d = marks[i][1];
      const start = marks[i].index + marks[i][0].length;
      const end = i + 1 < marks.length ? marks[i + 1].index : text.length;
      const ms = parseLocalDate(d).getTime();
      if (ms >= from && ms < dayStart.getTime()) {
        items.push({ date: d, text: text.slice(start, end).trim() });
      }
    }
  }
  return items.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, historyDays);
}

// ---------- 汇总 ----------

function main() {
  const { dbFile, sessions, prompts, weekDirs } = querySessions();

  let project = null;
  let candidates = [];

  if (projectArg) {
    const abs = normDir(projectArg);
    if (!fs.existsSync(abs)) throw new Error(`--project 路径不存在：${abs}`);
    const okGit = isGitRepo(abs);
    const okSvn = isSvnRepo(abs);
    project = { path: abs, source: 'argument', isGit: okGit, isSvn: okSvn };
    candidates = [{
      directory: abs,
      sessions: sessions.filter((s) => normDir(s.directory) === abs).length,
      isGit: okGit,
      isSvn: okSvn,
      commits: okGit ? gitCommitCount(abs) : 0,
      svnCommits: okSvn ? svnCommitCount(abs) : 0,
    }];
  } else {
    const inferred = inferProject(sessions, weekDirs);
    candidates = inferred.candidates;
    project = inferred.chosen
      ? {
        path: inferred.chosen.directory,
        source: 'auto',
        isGit: inferred.chosen.isGit,
        isSvn: inferred.chosen.isSvn,
      }
      : null;
  }

  if (project) project.vcs = vcsOf(project);

  let gitData = null;
  let svnData = null;
  if (project && project.isGit) {
    gitData = collectGit(project.path);
  }
  if (project && project.isSvn) {
    svnData = collectSvn(project.path);
  }

  // 限流：单个会话最多 12 条、当天总计最多 150 条，防止素材 JSON 过大
  const MAX_PER_SESSION = 12;
  const MAX_TOTAL = 150;
  const promptBySession = new Map();
  let kept = 0;
  for (const p of prompts) {
    if (kept >= MAX_TOTAL) break;
    if (!promptBySession.has(p.session_id)) promptBySession.set(p.session_id, []);
    const list = promptBySession.get(p.session_id);
    if (list.length >= MAX_PER_SESSION) continue;
    list.push({
      time: formatDateTime(p.time_created),
      text: String(p.text || '').slice(0, 600),
    });
    kept++;
  }

  const sessionItems = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    directory: s.directory,
    created: formatDateTime(s.time_created),
    updated: formatDateTime(s.time_updated),
    createdToday: s.time_created >= dayStart.getTime(),
    userPrompts: promptBySession.get(s.id) || [],
    additions: s.summary_additions,
    deletions: s.summary_deletions,
    files: s.summary_files,
  }));

  const commits = gitData ? gitData.commits : [];
  const myCommits = commits.filter((c) => c.isMine === true);
  const svnCommits = svnData ? svnData.commits : [];
  const mySvnCommits = svnCommits.filter((c) => c.isMine === true);
  const promptCount = prompts.length;

  const report = {
    date: dateStr,
    generatedAt: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    opencodeDb: dbFile,
    project,
    projectCandidates: candidates.map((c) => ({
      ...c,
      selected: project ? c.directory === project.path : false,
    })),
    git: gitData
      ? {
        branch: gitData.branch,
        userName: gitData.userName,
        userEmail: gitData.userEmail,
        commits,
        uncommitted: gitData.uncommitted,
      }
      : null,
    svn: svnData,
    sessions: sessionItems,
    history: readHistory(),
    config: {
      file: CONFIG.file,
      configured: CONFIG.configured,
      gitAuthors: CONFIG.authors,
      gitEmails: CONFIG.emails,
      svnAuthors: CONFIG.svnAuthors,
      svnConfigured: CONFIG.svnConfigured,
      error: CONFIG.error || null,
    },
    stats: {
      commitCount: commits.length,
      myCommitCount: myCommits.length,
      svnCommitCount: svnCommits.length,
      mySvnCommitCount: mySvnCommits.length,
      sessionCount: sessions.length,
      userPromptCount: promptCount,
      // 有「我的」真实信号才允许基本不编；全空才进入纯编造模式
      hasRealSignal: myCommits.length > 0 || mySvnCommits.length > 0 || promptCount > 0,
    },
  };

  const json = JSON.stringify(report, null, 2);
  if (outFile) {
    fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
    fs.writeFileSync(outFile, json, 'utf8');
  }
  process.stdout.write(json + '\n');
}

main();
