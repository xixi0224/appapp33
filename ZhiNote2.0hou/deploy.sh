#!/bin/bash
# ZhiNote 后端部署脚本
# 使用方法: bash deploy.sh

echo "========================================"
echo "         ZhiNote 后端部署脚本"
echo "========================================"

# 1. 更新系统
echo "1/7 更新系统..."
sudo apt update && sudo apt upgrade -y

# 2. 安装依赖
echo "2/7 安装依赖..."
sudo apt install -y python3 python3-pip python3-venv ffmpeg mysql-server nginx git

# 3. 配置 MySQL
echo "3/7 配置 MySQL..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS zhinote CHARACTER SET utf8mb4;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'zhinote'@'localhost' IDENTIFIED BY 'Zh1n0t3@2024';"
sudo mysql -e "GRANT ALL PRIVILEGES ON zhinote.* TO 'zhinote'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# 4. 创建项目目录
echo "4/7 创建项目目录..."
mkdir -p /var/www/zhinote
cd /var/www/zhinote
git clone https://github.com/xixi0224/design2.git .

# 5. 创建虚拟环境并安装依赖
echo "5/7 安装 Python 依赖..."
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 6. 创建环境配置
echo "6/7 配置环境变量..."
cat > /var/www/zhinote/.env << 'EOF'
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=zhinote
MYSQL_PASSWORD=Zh1n0t3@2024
MYSQL_DATABASE=zhinote
DASHSCOPE_API_KEY=sk-1ba4b8933405452fa18df0e90b6ddfbc
DASHSCOPE_MODEL=qwen-plus
EOF

# 7. 导入数据库表
echo "7/7 导入数据库表..."
mysql -u zhinote -pZh1n0t3@2024 zhinote < sql/create_users.sql
mysql -u zhinote -pZh1n0t3@2024 zhinote < sql/create_learning_plan.sql
mysql -u zhinote -pZh1n0t3@2024 zhinote < sql/knowledge_graph.sql
mysql -u zhinote -pZh1n0t3@2024 zhinote < sql/study_stats.sql
mysql -u zhinote -pZh1n0t3@2024 zhinote < sql/add_nickname_field.sql

# 8. 创建 Gunicorn 配置
cat > /var/www/zhinote/gunicorn_config.py << 'EOF'
workers = 2
worker_class = "uvicorn.workers.UvicornWorker"
bind = "127.0.0.1:8000"
timeout = 120
EOF

# 9. 创建 Systemd 服务
cat > /etc/systemd/system/zhinote.service << 'EOF'
[Unit]
Description=ZhiNote Backend Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/var/www/zhinote
Environment="PATH=/var/www/zhinote/venv/bin"
ExecStart=/var/www/zhinote/venv/bin/gunicorn -c gunicorn_config.py app.main:app
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 10. 配置 Nginx
cat > /etc/nginx/sites-available/zhinote << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

# 11. 启用配置
ln -sf /etc/nginx/sites-available/zhinote /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 12. 启动服务
systemctl daemon-reload
systemctl enable zhinote
systemctl start zhinote

echo ""
echo "========================================"
echo "           部署完成！"
echo "========================================"
echo "API 地址: http://$(curl -s ifconfig.me)"
echo "API 文档: http://$(curl -s ifconfig.me)/docs"
echo ""
echo "服务管理命令:"
echo "  sudo systemctl start zhinote    # 启动服务"
echo "  sudo systemctl stop zhinote     # 停止服务"
echo "  sudo systemctl restart zhinote  # 重启服务"
echo "  sudo systemctl status zhinote   # 查看状态"
echo "  sudo journalctl -u zhinote -f   # 查看日志"