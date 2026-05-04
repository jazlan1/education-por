const { existsSync, rmSync, cpSync } = require('fs');
const { join, resolve } = require('path');
const { execFileSync } = require('child_process');

const cwd = process.cwd();
const repoRoot = existsSync(join(cwd, 'frontend', 'package.json'))
  ? cwd
  : existsSync(join(cwd, '..', 'frontend', 'package.json'))
    ? resolve(cwd, '..')
    : cwd;

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const commandOptions = {
  stdio: 'inherit',
  shell: process.platform === 'win32',
};
const frontendDir = existsSync(join(repoRoot, 'frontend', 'package.json'))
  ? join(repoRoot, 'frontend')
  : repoRoot;

execFileSync(npm, ['run', 'build', '--prefix', frontendDir], commandOptions);

const sourceBuild = join(frontendDir, 'build');
const rootBuild = join(repoRoot, 'build');

if (cwd === repoRoot && sourceBuild !== rootBuild && existsSync(sourceBuild)) {
  rmSync(rootBuild, { recursive: true, force: true });
  cpSync(sourceBuild, rootBuild, { recursive: true });
}
