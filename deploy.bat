@echo off
chcp 65001
echo ========================================
echo ZhiNote 2.0 快速部署脚本
echo ========================================
echo.

echo [步骤1] 检查Python环境...
python --version
if %errorlevel% neq 0 (
    echo ❌ 未检测到Python，请先安装Python 3.8+
    pause
    exit /b 1
)
echo ✅ Python环境正常
echo.

echo [步骤2] 检查依赖...
if not exist "venv" (
    echo 创建虚拟环境...
    python -m venv venv
)

echo 激活虚拟环境...
call venv\Scripts\activate.bat

echo 安装依赖...
pip install -r requirements.txt
echo.

echo [步骤3] 检查数据库配置...
echo 请确保MySQL已启动，并执行以下SQL：
echo   CREATE DATABASE zhinote CHARACTER SET utf8mb4;
echo.
pause

echo [步骤4] 启动后端服务...
echo.
echo ========================================
echo 后端服务将在 http://localhost:8000 启动
echo API文档：http://localhost:8000/docs
echo ========================================
echo.
echo 按Ctrl+C可停止服务
echo.

cd ZhiNote2.0hou
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
