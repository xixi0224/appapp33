from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float, JSON, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_USER = os.getenv("MYSQL_USER", "")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "zhinote")

<<<<<<< HEAD
SQLALCHEMY_DATABASE_URL = "sqlite:///./zhinote.db"

if MYSQL_USER:
=======
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./zhinote.db")

if not SQLALCHEMY_DATABASE_URL.startswith("postgres") and not SQLALCHEMY_DATABASE_URL.startswith("postgresql") and MYSQL_USER:
>>>>>>> 4f174552fdd0bf3d635780d8f0719457d5ed4a57
    try:
        if MYSQL_PASSWORD:
            encoded_password = urllib.parse.quote_plus(MYSQL_PASSWORD)
            SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{encoded_password}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}?charset=utf8mb4"
        else:
            SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}?charset=utf8mb4"
    except:
        pass

try:
    if "mysql" in SQLALCHEMY_DATABASE_URL:
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
<<<<<<< HEAD
    else:
        engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
except Exception as e:
    print(f"MySQL连接失败，使用SQLite: {e}")
=======
    elif "postgres" in SQLALCHEMY_DATABASE_URL or "postgresql" in SQLALCHEMY_DATABASE_URL:
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
    else:
        engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
except Exception as e:
    print(f"数据库连接失败，使用SQLite: {e}")
>>>>>>> 4f174552fdd0bf3d635780d8f0719457d5ed4a57
    SQLALCHEMY_DATABASE_URL = "sqlite:///./zhinote.db"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100))
    avatar = Column(String(500), default="")
    major = Column(String(100), default="")
    learning_direction = Column(String(200), default="")
    preferences = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    role = Column(String(20), default="student")
    session_id = Column(String(50))
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id = Column(String(50), primary_key=True, index=True)
    session_key = Column(String(100), unique=True, index=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    profile = relationship("StudentProfile", back_populates="session", uselist=False)
    plans = relationship("LearningPlan", back_populates="session")
    questions = relationship("QuestionBank", back_populates="session")
    mistakes = relationship("MistakeRecord", back_populates="session")
    records = relationship("LearningRecord", back_populates="session")
    resources = relationship("GeneratedResource", back_populates="session")
    chat_history = relationship("ChatMessage", back_populates="session")
    uploaded_docs = relationship("UploadedDocument", back_populates="session")

class StudentProfile(Base):
    __tablename__ = "student_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(50), ForeignKey("user_sessions.id"))
    major = Column(String(100), default="")
    knowledge_base = Column(JSON, default=dict)
    learning_goal = Column(String(500), default="")
    learning_speed = Column(String(50), default="")
    weak_points = Column(JSON, default=list)
    cognitive_style = Column(String(50), default="")
    profile_json = Column(JSON, default=dict)
    update_history = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    session = relationship("UserSession", back_populates="profile")

class LearningPlan(Base):
    __tablename__ = "learning_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(50), ForeignKey("user_sessions.id"))
    step = Column(Integer, default=0)
    week = Column(Integer, default=0)
    title = Column(String(200))
    knowledge_point_id = Column(Integer)
    knowledge_point_name = Column(String(200))
    subject = Column(String(100))
    chapter = Column(String(200))
    stage = Column(String(50))
    goals = Column(JSON)
    resources = Column(JSON)
    estimated_time = Column(String(50))
    status = Column(String(20), default="pending")
    plan_json = Column(JSON)
    plan_version = Column(Integer, default=1)
    update_history = Column(JSON)
    created_at = Column(DateTime, default=datetime.now)
    
    session = relationship("UserSession", back_populates="plans")

class QuestionBank(Base):
    __tablename__ = "question_bank"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(50), ForeignKey("user_sessions.id"))
    subject = Column(String(100))
    topic = Column(String(200))
    question = Column(Text)
    question_type = Column(String(20), default="choice")
    options = Column(JSON, default=list)
    correct_answer = Column(Text)
    analysis = Column(Text)
    difficulty = Column(String(20), default="medium")
    error_tags = Column(JSON, default=list)
    related_document_id = Column(Integer, default=0)
    generated_from = Column(String(100), default="agent")
    created_at = Column(DateTime, default=datetime.now)
    
    session = relationship("UserSession", back_populates="questions")

class MistakeRecord(Base):
    __tablename__ = "mistake_records"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(50), ForeignKey("user_sessions.id"))
    question_id = Column(Integer, default=0)
    question = Column(Text)
    question_type = Column(String(20), default="choice")
    user_answer = Column(Text)
    correct_answer = Column(Text)
    analysis = Column(Text)
    error_tags = Column(JSON, default=list)
    error_detail = Column(Text)
    related_knowledge = Column(String(200))
    subject = Column(String(100))
    topic = Column(String(200))
    difficulty = Column(String(20), default="medium")
    reviewed = Column(Boolean, default=False)
    review_count = Column(Integer, default=0)
    related_document_id = Column(Integer, default=0)
    source_type = Column(String(20), default="agent")
    created_at = Column(DateTime, default=datetime.now)
    
    session = relationship("UserSession", back_populates="mistakes")

class LearningRecord(Base):
    __tablename__ = "learning_records"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(50), ForeignKey("user_sessions.id"))
    type = Column(String(50))
    topic = Column(String(200))
    detail = Column(Text)
    duration = Column(String(50))
    score = Column(Float)
    created_at = Column(DateTime, default=datetime.now)
    
    session = relationship("UserSession", back_populates="records")

class GeneratedResource(Base):
    __tablename__ = "generated_resources"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(50), ForeignKey("user_sessions.id"))
    type = Column(String(50))
    title = Column(String(200))
    content = Column(Text)
    topic = Column(String(200))
    created_at = Column(DateTime, default=datetime.now)
    
    session = relationship("UserSession", back_populates="resources")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(50), ForeignKey("user_sessions.id"))
    role = Column(String(20))
    content = Column(Text)
    intent = Column(String(50))
    created_at = Column(DateTime, default=datetime.now)
    
    session = relationship("UserSession", back_populates="chat_history")

class UploadedDocument(Base):
    __tablename__ = "uploaded_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(50), ForeignKey("user_sessions.id"))
    filename = Column(String(200))
    file_path = Column(String(500))
    file_type = Column(String(50))
    file_size = Column(Integer, default=0)
    content = Column(Text)
    extracted_topics = Column(JSON, default=list)
    full_analysis = Column(JSON)
    status = Column(String(20), default="pending")
    topics_count = Column(Integer, default=0)
    query_count = Column(Integer, default=0)
    subject = Column(String(100))
    chapter = Column(String(200))
    vector_index_id = Column(String(100))
    source_type = Column(String(50), default="manual")
    created_at = Column(DateTime, default=datetime.now)
    
    session = relationship("UserSession", back_populates="uploaded_docs")
    knowledge_points = relationship("KnowledgePoint", back_populates="document")

class KnowledgePoint(Base):
    __tablename__ = "knowledge_points"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("uploaded_documents.id"))
    session_id = Column(String(50))
    subject = Column(String(100))
    chapter = Column(String(200))
    name = Column(String(200))
    definition = Column(Text)
    difficulty = Column(String(20), default="medium")
    is_key = Column(Boolean, default=False)
    is_exam_point = Column(Boolean, default=False)
    error_tags = Column(JSON, default=list)
    prerequisites = Column(JSON, default=list)
    structured_data = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.now)
    
    document = relationship("UploadedDocument", back_populates="knowledge_points")

def init_db():
    Base.metadata.create_all(bind=engine)
    
    if "mysql" in str(engine.url):
        from sqlalchemy import text
        migrations = [
            "ALTER TABLE uploaded_documents ADD COLUMN file_size INT DEFAULT 0",
            "ALTER TABLE uploaded_documents ADD COLUMN processed BOOLEAN DEFAULT FALSE",
            "ALTER TABLE uploaded_documents ADD COLUMN topics_count INT DEFAULT 0",
            "ALTER TABLE uploaded_documents ADD COLUMN query_count INT DEFAULT 0",
            "ALTER TABLE uploaded_documents ADD COLUMN full_analysis JSON",
            "ALTER TABLE uploaded_documents ADD COLUMN status VARCHAR(20) DEFAULT 'pending'",
            "ALTER TABLE uploaded_documents ADD COLUMN subject VARCHAR(100)",
            "ALTER TABLE uploaded_documents ADD COLUMN chapter VARCHAR(200)",
            "ALTER TABLE uploaded_documents ADD COLUMN vector_index_id VARCHAR(100)",
            "ALTER TABLE uploaded_documents ADD COLUMN source_type VARCHAR(50) DEFAULT 'manual'",
            "ALTER TABLE mistake_records ADD COLUMN question_id INT DEFAULT 0",
            "ALTER TABLE mistake_records ADD COLUMN question_type VARCHAR(20) DEFAULT 'choice'",
            "ALTER TABLE mistake_records ADD COLUMN error_detail TEXT",
            "ALTER TABLE mistake_records ADD COLUMN difficulty VARCHAR(20) DEFAULT 'medium'",
            "ALTER TABLE mistake_records ADD COLUMN related_document_id INT DEFAULT 0",
            "ALTER TABLE mistake_records ADD COLUMN source_type VARCHAR(20) DEFAULT 'agent'",
            "ALTER TABLE mistake_records ADD COLUMN subject VARCHAR(100)",
            "ALTER TABLE mistake_records ADD COLUMN topic VARCHAR(200)",
            "ALTER TABLE mistake_records ADD COLUMN reviewed BOOLEAN DEFAULT FALSE",
            "ALTER TABLE mistake_records ADD COLUMN review_count INT DEFAULT 0",
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
            """,
            """
            CREATE TABLE IF NOT EXISTS knowledge_points (
                id INT AUTO_INCREMENT PRIMARY KEY,
                document_id INT,
                session_id VARCHAR(50),
                subject VARCHAR(100),
                chapter VARCHAR(200),
                name VARCHAR(200),
                definition TEXT,
                difficulty VARCHAR(20) DEFAULT 'medium',
                is_key BOOLEAN DEFAULT FALSE,
                is_exam_point BOOLEAN DEFAULT FALSE,
                error_tags JSON,
                prerequisites JSON,
                structured_data JSON,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_document_id (document_id),
                INDEX idx_session_id_kp (session_id)
            )
            """,
            "ALTER TABLE users ADD COLUMN avatar VARCHAR(500)",
            "ALTER TABLE users ADD COLUMN major VARCHAR(100)",
            "ALTER TABLE users ADD COLUMN learning_direction VARCHAR(200)",
            "ALTER TABLE users ADD COLUMN preferences JSON",
            "ALTER TABLE users ADD COLUMN is_active BOOLEAN",
            "ALTER TABLE users ADD COLUMN role VARCHAR(20)",
            "ALTER TABLE users ADD COLUMN updated_at DATETIME",
            "ALTER TABLE users ADD COLUMN session_id VARCHAR(50)",
            "UPDATE users SET avatar = '' WHERE avatar IS NULL",
            "UPDATE users SET major = '' WHERE major IS NULL",
            "UPDATE users SET learning_direction = '' WHERE learning_direction IS NULL",
            "UPDATE users SET preferences = '{}' WHERE preferences IS NULL",
            "UPDATE users SET is_active = 1 WHERE is_active IS NULL",
            "UPDATE users SET role = 'student' WHERE role IS NULL",
            "UPDATE users SET updated_at = NOW() WHERE updated_at IS NULL"
        ]
        for sql in migrations:
            try:
                with engine.begin() as conn:
                    conn.execute(text(sql))
                print(f"Migration OK: {sql[:50]}...")
            except Exception as e:
                print(f"Migration skipped: {e}")
        print("MySQL migrations completed")
