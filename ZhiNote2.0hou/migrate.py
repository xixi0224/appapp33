import os
import urllib.parse
from sqlalchemy import create_engine, text

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_USER = os.getenv("MYSQL_USER", "")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "zhinote")

encoded_password = urllib.parse.quote_plus(MYSQL_PASSWORD)
DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{encoded_password}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}?charset=utf8mb4"

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    migrations = [
        "ALTER TABLE mistake_records ADD COLUMN IF NOT EXISTS question_id INT DEFAULT 0",
        "ALTER TABLE mistake_records ADD COLUMN IF NOT EXISTS question_type VARCHAR(20) DEFAULT 'choice'",
        "ALTER TABLE mistake_records ADD COLUMN IF NOT EXISTS error_detail TEXT",
        "ALTER TABLE mistake_records ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'medium'",
        "ALTER TABLE mistake_records ADD COLUMN IF NOT EXISTS related_document_id INT DEFAULT 0",
        "ALTER TABLE mistake_records ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'agent'",
        "ALTER TABLE mistake_records ADD COLUMN IF NOT EXISTS subject VARCHAR(100)",
        "ALTER TABLE mistake_records ADD COLUMN IF NOT EXISTS topic VARCHAR(200)",
        "ALTER TABLE mistake_records ADD COLUMN IF NOT EXISTS reviewed BOOLEAN DEFAULT FALSE",
        "ALTER TABLE mistake_records ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0",
        """
        CREATE TABLE IF NOT EXISTS question_bank (
            id INT AUTO_INCREMENT PRIMARY KEY,
            session_id VARCHAR(50),
            subject VARCHAR(100),
            topic VARCHAR(200),
            question TEXT,
            question_type VARCHAR(20) DEFAULT 'choice',
            options JSON,
            correct_answer TEXT,
            analysis TEXT,
            difficulty VARCHAR(20) DEFAULT 'medium',
            error_tags JSON,
            related_document_id INT DEFAULT 0,
            generated_from VARCHAR(100) DEFAULT 'agent',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_session_id (session_id)
        )
        """
    ]
    for i, sql in enumerate(migrations):
        try:
            conn.execute(text(sql))
            print(f"Migration {i+1}: OK")
        except Exception as e:
            print(f"Migration {i+1}: {e}")
    conn.commit()
    print("All migrations completed")
