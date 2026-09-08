const { spawn } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
let stopping = false;
const children = [
  spawn('npm', ['start'], { cwd: path.join(root, 'frontend'), env: { ...process.env, PORT: process.env.FRONTEND_PORT || '3001' }, stdio: 'inherit', detached: true }),
  spawn('npm', ['run', 'dev'], { cwd: path.join(root, 'backend'), stdio: 'inherit', detached: true }),
];
function stop(code) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) {
    if (child.pid) { try { process.kill(-child.pid, 'SIGTERM'); } catch (err) { if (err.code !== 'ESRCH') throw err; } }
  }
}
for (const child of children) {
  child.on('error', err => { console.error(err.message); stop(1); });
  child.on('exit', code => stop(code ?? 1));
}
process.on('SIGINT', () => stop(130));
process.on('SIGTERM', () => stop(143));
