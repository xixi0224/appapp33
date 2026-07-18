from fastapi import APIRouter, Depends, HTTPException, Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import SessionLocal, User, UserSession, StudentProfile, LearningPlan, MistakeRecord, LearningRecord, GeneratedResource, ChatMessage, UploadedDocument, KnowledgePoint, QuestionBank
from app.services.db_service import get_db, get_or_create_session
from pydantic import BaseModel
import hashlib
import jwt
import time
import os
from datetime import datetime

router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET", "zhinote_secret_key_2024")
JWT_ALGORITHM = "HS256"

security = HTTPBearer()

class RegisterRequest(BaseModel):
    username: str
    password: str
    email: str = ""

class LoginRequest(BaseModel):
    username: str
    password: str

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed_password: str) -> bool:
    return hash_password(password) == hashed_password

def create_token(user_id: int, username: str) -> str:
    payload = {
        "user_id": user_id,
        "username": username,
        "exp": time.time() + 86400
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload["exp"] < time.time():
            return None
        return payload
    except:
        return None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == payload["user_id"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.post("/auth/register")
async def register(request: RegisterRequest, session_key: str = Cookie(None), db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        return {"code": 1, "message": "用户名已存在"}
    
    db_session = get_or_create_session(db, session_key)
    
    user = User(
        username=request.username,
        password_hash=hash_password(request.password),
        email=request.email,
        session_id=db_session.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"code": 0, "data": {"user_id": user.id, "username": user.username}}

@router.post("/auth/login")
async def login(request: LoginRequest, session_key: str = Cookie(None), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.password_hash):
        return {"code": 1, "message": "用户名或密码错误"}
    
    db_session = get_or_create_session(db, session_key)
    
    if not user.session_id:
        user.session_id = db_session.id
    elif user.session_id != db_session.id:
        old_session_id = user.session_id
        existing_profiles = db.query(StudentProfile).filter(StudentProfile.session_id == db_session.id).all()
        if existing_profiles:
            for ep in existing_profiles:
                db.delete(ep)
        
        db.query(StudentProfile).filter(StudentProfile.session_id == old_session_id).update({"session_id": db_session.id})
        db.query(LearningPlan).filter(LearningPlan.session_id == old_session_id).update({"session_id": db_session.id})
        db.query(MistakeRecord).filter(MistakeRecord.session_id == old_session_id).update({"session_id": db_session.id})
        db.query(LearningRecord).filter(LearningRecord.session_id == old_session_id).update({"session_id": db_session.id})
        db.query(GeneratedResource).filter(GeneratedResource.session_id == old_session_id).update({"session_id": db_session.id})
        db.query(ChatMessage).filter(ChatMessage.session_id == old_session_id).update({"session_id": db_session.id})
        db.query(UploadedDocument).filter(UploadedDocument.session_id == old_session_id).update({"session_id": db_session.id})
        db.query(KnowledgePoint).filter(KnowledgePoint.session_id == old_session_id).update({"session_id": db_session.id})
        db.query(QuestionBank).filter(QuestionBank.session_id == old_session_id).update({"session_id": db_session.id})
        
        old_session = db.query(UserSession).filter(UserSession.id == old_session_id).first()
        if old_session:
            db.delete(old_session)
        
        user.session_id = db_session.id
    
    db.commit()
    
    token = create_token(user.id, user.username)
    
    return {
        "code": 0,
        "data": {
            "token": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "session_id": user.session_id
            }
        }
    }

@router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "code": 0,
        "data": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "session_id": user.session_id,
            "created_at": user.created_at.isoformat()
        }
    }

@router.post("/auth/logout")
async def logout():
    return {"code": 0, "message": "Logout successful"}

class UpdateUserRequest(BaseModel):
    username: str = ""
    avatar: str = ""
    major: str = ""
    learning_direction: str = ""
    preferences: dict = {}

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

@router.get("/auth/user/profile")
async def get_user_profile(user: User = Depends(get_current_user)):
    return {
        "code": 0,
        "data": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "avatar": user.avatar,
            "major": user.major,
            "learning_direction": user.learning_direction,
            "role": user.role,
            "preferences": user.preferences,
            "created_at": user.created_at.isoformat()
        }
    }

@router.post("/auth/user/profile")
async def update_user_profile(request: UpdateUserRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if request.username:
        existing = db.query(User).filter(User.username == request.username, User.id != user.id).first()
        if existing:
            return {"code": 1, "message": "用户名已被使用"}
        user.username = request.username
    
    if request.avatar:
        user.avatar = request.avatar
    if request.major:
        user.major = request.major
    if request.learning_direction:
        user.learning_direction = request.learning_direction
    if request.preferences:
        user.preferences = request.preferences
    
    db.commit()
    db.refresh(user)
    
    return {
        "code": 0,
        "data": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "avatar": user.avatar,
            "major": user.major,
            "learning_direction": user.learning_direction,
            "role": user.role,
            "preferences": user.preferences,
            "created_at": user.created_at.isoformat()
        }
    }

@router.post("/auth/user/change-password")
async def change_password(request: ChangePasswordRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(request.old_password, user.password_hash):
        return {"code": 1, "message": "旧密码不正确"}
    
    user.password_hash = hash_password(request.new_password)
    db.commit()
    
    return {"code": 0, "message": "密码修改成功"}

@router.get("/auth/user/statistics")
async def get_user_statistics(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.database import UploadedDocument, KnowledgePoint, QuestionBank, MistakeRecord, LearningPlan, LearningRecord
    
    session_id = user.session_id or str(user.id)
    
    doc_count = db.query(UploadedDocument).filter(UploadedDocument.session_id == session_id).count()
    kp_count = db.query(KnowledgePoint).filter(KnowledgePoint.session_id == session_id).count()
    question_count = db.query(QuestionBank).filter(QuestionBank.session_id == session_id).count()
    mistake_count = db.query(MistakeRecord).filter(MistakeRecord.session_id == session_id).count()
    plan_count = db.query(LearningPlan).filter(LearningPlan.session_id == session_id).count()
    
    completed_plans = db.query(LearningPlan).filter(
        LearningPlan.session_id == session_id,
        LearningPlan.status == "completed"
    ).count()
    
    records = db.query(LearningRecord).filter(LearningRecord.session_id == session_id).all()
    total_score = sum(r.score for r in records if r.score)
    avg_accuracy = round(total_score / len(records), 2) if records else 0
    
    mistake_tags = {}
    mistakes = db.query(MistakeRecord).filter(MistakeRecord.session_id == session_id).all()
    for m in mistakes:
        for tag in (m.error_tags or []):
            mistake_tags[tag] = mistake_tags.get(tag, 0) + 1
    
    total_days = len(set(r.created_at.date() for r in records))
    
    return {
        "code": 0,
        "data": {
            "knowledge_base": {
                "document_count": doc_count,
                "knowledge_point_count": kp_count
            },
            "learning": {
                "total_days": total_days,
                "total_questions": question_count,
                "avg_accuracy": avg_accuracy,
                "completed_plans": completed_plans,
                "total_plans": plan_count
            },
            "mistakes": {
                "total_count": mistake_count,
                "error_tags": mistake_tags
            }
        }
    }

@router.get("/auth/user/export-report")
async def export_learning_report(format: str = "markdown", user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.database import UploadedDocument, KnowledgePoint, QuestionBank, MistakeRecord, LearningPlan, LearningRecord, StudentProfile
    import json
    
    session_id = user.session_id or str(user.id)
    
    profile = db.query(StudentProfile).filter(StudentProfile.session_id == session_id).first()
    
    docs = db.query(UploadedDocument).filter(UploadedDocument.session_id == session_id).all()
    kps = db.query(KnowledgePoint).filter(KnowledgePoint.session_id == session_id).all()
    mistakes = db.query(MistakeRecord).filter(MistakeRecord.session_id == session_id).all()
    plans = db.query(LearningPlan).filter(LearningPlan.session_id == session_id).all()
    records = db.query(LearningRecord).filter(LearningRecord.session_id == session_id).all()
    
    mistake_tags = {}
    for m in mistakes:
        for tag in (m.error_tags or []):
            mistake_tags[tag] = mistake_tags.get(tag, 0) + 1
    
    total_days = len(set(r.created_at.date() for r in records))
    total_questions = len([r for r in records if r.type == 'question'])
    avg_accuracy = round(sum(r.score for r in records if r.score) / len(records), 2) if records else 0
    completed_plans = len([p for p in plans if p.status == 'completed'])
    total_plans = len(plans)
    
    if format == "txt":
        report = f"""=== 个人学习报告 ===

【基本信息】
用户名: {user.username}
专业: {user.major or '未设置'}
学习方向: {user.learning_direction or '未设置'}
注册时间: {user.created_at.strftime('%Y-%m-%d %H:%M:%S')}

【学习画像】
{json.dumps(profile.profile_json, ensure_ascii=False, indent=2) if profile and profile.profile_json else '暂无画像数据'}

【知识库统计】
上传文档数: {len(docs)}
提取知识点数: {len(kps)}

文档列表:
{chr(10).join([f"- {d.filename}" for d in docs]) or '无'}

【学习统计】
总学习天数: {total_days}
总做题量: {total_questions}
平均正确率: {avg_accuracy}%
完成学习路径: {completed_plans} / {total_plans}

【错题统计】
累计错题数: {len(mistakes)}

高频错误类型:
{chr(10).join([f"- {tag}: {count}次" for tag, count in dict(sorted(mistake_tags.items(), key=lambda x: -x[1])).items()]) or '无'}

错题列表:
{chr(10).join([f"- [{m.topic}] {m.question[:50]}..." for m in mistakes]) or '无'}

【知识点掌握情况】
{chr(10).join([f"- {kp.name}: 难度{kp.difficulty}" for kp in kps]) or '无'}

=====================================
报告生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
    else:
        report = f"""# 个人学习报告

## 一、基本信息

- **用户名**: {user.username}
- **专业**: {user.major or '未设置'}
- **学习方向**: {user.learning_direction or '未设置'}
- **注册时间**: {user.created_at.strftime('%Y-%m-%d %H:%M:%S')}

## 二、学习画像

```json
{json.dumps(profile.profile_json, ensure_ascii=False, indent=2) if profile and profile.profile_json else '{}'}
```

## 三、知识库统计

- **上传文档数**: {len(docs)}
- **提取知识点数**: {len(kps)}

### 文档列表
{chr(10).join([f"- {d.filename}" for d in docs]) or '无'}

## 四、学习统计

- **总学习天数**: {total_days}
- **总做题量**: {total_questions}
- **平均正确率**: {avg_accuracy}%
- **完成学习路径**: {completed_plans} / {total_plans}

## 五、错题统计

- **累计错题数**: {len(mistakes)}

### 高频错误类型
{chr(10).join([f"- {tag}: {count}次" for tag, count in dict(sorted(mistake_tags.items(), key=lambda x: -x[1])).items()]) or '无'}

### 错题列表
{chr(10).join([f"- [{m.topic}] {m.question[:50]}..." for m in mistakes]) or '无'}

## 六、知识点掌握情况

{chr(10).join([f"- {kp.name}: 难度{kp.difficulty}" for kp in kps]) or '无'}

---
*报告生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*
"""
    
    return {
        "code": 0,
        "data": {
            "content": report,
            "format": format
        }
    }