import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.environ.get("MYSQL_HOST", "127.0.0.1"),
    "port": int(os.environ.get("MYSQL_PORT", "3306")),
    "user": os.environ.get("MYSQL_USER", "root"),
    "password": os.environ.get("MYSQL_PASSWORD", ""),
    "database": os.environ.get("MYSQL_DATABASE", "zhinote"),
    "charset": "utf8mb4",
}

DASHSCOPE_API_KEY = os.environ.get("DASHSCOPE_API_KEY", "")
DASHSCOPE_MODEL = os.environ.get("DASHSCOPE_MODEL", "qwen-plus")

SPARKAI_APP_ID = os.environ.get("SPARKAI_APP_ID", "")
SPARKAI_API_KEY = os.environ.get("SPARKAI_API_KEY", "")
SPARKAI_API_SECRET = os.environ.get("SPARKAI_API_SECRET", "")
SPARKAI_URL = os.environ.get("SPARKAI_URL", "wss://spark-api.xf-yun.com/v1.1/chat")
SPARKAI_DOMAIN = os.environ.get("SPARKAI_DOMAIN", "lite")
