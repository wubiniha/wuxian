module.exports = {
  apps: [{
    name: 'wuxian-canvas',
    cwd: '/opt/wuxian-canvas',
    script: 'npm',
    args: 'run start -- --host 0.0.0.0 --port 11081',
    env: { NODE_ENV: 'production', APP_BASE_PATH: '/video' },
    autorestart: true,
    max_memory_restart: '512M',
  }],
};
