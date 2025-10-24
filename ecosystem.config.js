module.exports = {
  apps: [
    {
      name: 'bettrfitness-dashboard',
      script: 'server.js',
      cwd: '/var/www/betterfitness-dashboard/betterfitness-dashboard',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: '/var/log/pm2/bettrfitness-dashboard-error.log',
      out_file: '/var/log/pm2/bettrfitness-dashboard-out.log',
      log_file: '/var/log/pm2/bettrfitness-dashboard-combined.log',
      time: true
    }
  ]
};