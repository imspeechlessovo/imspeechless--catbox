#!/bin/bash
# ========================================
# ????? - ????
# ========================================
set -e

echo "==> 1. Install Node.js 18+"
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "Node: $(node -v), npm: $(npm -v)"

echo "==> 2. Install PM2"
sudo npm install -g pm2

echo "==> 3. Clone project"
cd ~
if [ ! -d maoxiang-countdown ]; then
  git clone https://github.com/imspeechlessovo/imspeechless--catbox.git maoxiang-countdown
fi
cd maoxiang-countdown

echo "==> 4. Setup backend"
cd backend
cp -n .env.production .env 2>/dev/null || true
echo "!!! Edit backend/.env and set JWT_SECRET + COOKIE_SECRET !!!"
npm install
npm run build
mkdir -p uploads
cd ..

echo "==> 5. Build frontend"
cd frontend
npm install
npm run build
cd ..

echo "==> 6. Start with PM2"
pm2 delete maoxiang 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "==> DONE!"
echo "App running on http://localhost:3000"
echo ""
echo "Next steps:"
echo "  1. Edit backend/.env - set JWT_SECRET and COOKIE_SECRET"
echo "  2. Setup Nginx reverse proxy (optional)"
echo "  3. pm2 restart maoxiang"
