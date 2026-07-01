module.exports = {
  apps: [{
    name: 'maoxiang',
    script: 'dist/main.js',
    cwd: './backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    max_memory_restart: '300M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }],
};
