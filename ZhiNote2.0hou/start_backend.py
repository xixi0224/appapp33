import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'venv', 'Lib', 'site-packages'))

if __name__ == '__main__':
    try:
        from uvicorn.main import main
        sys.argv = ['uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000', '--workers', '1']
        main()
    except ImportError as e:
        print(f"Import error: {e}")
        print("Trying to install dependencies...")
        import subprocess
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'fastapi', 'uvicorn', 'sqlalchemy', 'pydantic', 'python-jose'])
        from uvicorn.main import main
        sys.argv = ['uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000', '--workers', '1']
        main()