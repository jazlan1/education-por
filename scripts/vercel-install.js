const { existsSync } = require('fs');
const { join, resolve } = require('path');
const { execFileSync } = require('child_process');

const cwd = process.cwd();
const repoRoot = existsSync(join(cwd, 'backend', 'package.json'))
  ? cwd
  : existsSync(join(cwd, '..', 'backend', 'package.json'))
    ? resolve(cwd, '..')
    : cwd;

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const commandOptions = {
  stdio: 'inherit',
  shell: process.platform === 'win32',
};

const installAt = (dir) => {
  if (!existsSync(join(dir, 'package.json'))) return;
  const command = existsSync(join(dir, 'package-lock.json')) ? 'ci' : 'install';
  execFileSync(npm, [command, '--prefix', dir], commandOptions);
};

installAt(join(repoRoot, 'backend'));
installAt(join(repoRoot, 'frontend'));
