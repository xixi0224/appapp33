import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal, UserSession, StudentProfile, LearningPlan, MistakeRecord, LearningRecord, GeneratedResource, ChatMessage, UploadedDocument, QuestionBank, KnowledgePoint

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_or_create_session(db: Session, session_key: str = None):
    if not session_key:
        session_key = str(uuid.uuid4())
    
    db_session = db.query(UserSession).filter(UserSession.session_key == session_key).first()
    if not db_session:
        db_session = UserSession(
            id=str(uuid.uuid4()),
            session_key=session_key,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
    
    return db_session

def get_profile(db: Session, session_id: str):
    return db.query(StudentProfile).filter(StudentProfile.session_id == session_id).first()

def save_profile(db: Session, session_id: str, profile_data: dict):
    profile = db.query(StudentProfile).filter(StudentProfile.session_id == session_id).first()
    
    raw_kb = profile_data.get('knowledge_base', profile_data.get('dimensions', {}).get('KnowledgeBase', 50))
    raw_lg = profile_data.get('learning_goal', profile_data.get('dimensions', {}).get('LearningGoal', 50))
    raw_ls = profile_data.get('learning_speed', profile_data.get('dimensions', {}).get('LearningSpeed', 50))
    raw_ep = profile_data.get('error_patterns', profile_data.get('dimensions', {}).get('ErrorPatterns', 50))
    raw_cs = profile_data.get('cognitive_style', profile_data.get('dimensions', {}).get('CognitiveStyle', 50))
    raw_id = profile_data.get('interest_direction', profile_data.get('dimensions', {}).get('InterestDirection', 50))
    
    def to_score(value):
        if isinstance(value, str):
            level_map = {'初级': 25, '中级': 50, '高级': 75, '快速': 80, '正常': 50, '慢速': 30, '实践型': 70, '理论型': 60, '平衡型': 50}
            return level_map.get(value, 50)
        try:
            val = float(value)
            return max(0, min(100, val))
        except:
            return 50
    
    dimension_scores = {
        'knowledge_base': to_score(raw_kb),
        'learning_goal': to_score(raw_lg),
        'learning_speed': to_score(raw_ls),
        'error_patterns': to_score(raw_ep),
        'cognitive_style': to_score(raw_cs),
        'interest_direction': to_score(raw_id)
    }
    
    dimension_texts = {
        'knowledge_base': str(raw_kb) if isinstance(raw_kb, str) else '',
        'learning_goal': str(raw_lg) if isinstance(raw_lg, str) else '',
        'learning_speed': str(raw_ls) if isinstance(raw_ls, str) else '',
        'error_patterns': str(raw_ep) if isinstance(raw_ep, str) else '',
        'cognitive_style': str(raw_cs) if isinstance(raw_cs, str) else '',
        'interest_direction': str(raw_id) if isinstance(raw_id, str) else ''
    }
    
    standardized_profile = {
        'major': profile_data.get('major', ''),
        'knowledge_base': dimension_scores['knowledge_base'],
        'learning_goal': dimension_scores['learning_goal'],
        'learning_speed': dimension_scores['learning_speed'],
        'error_patterns': dimension_scores['error_patterns'],
        'cognitive_style': dimension_scores['cognitive_style'],
        'interest_direction': dimension_scores['interest_direction'],
        'dimension_scores': dimension_scores,
        'dimension_texts': dimension_texts,
        'ai_summary': profile_data.get('ai_summary', profile_data.get('summary', '')),
        'weak_points': profile_data.get('weak_points', []),
        'dimensions': dimension_scores,
        'raw_data': profile_data
    }
    
    update_reason = profile_data.get('update_reason', '画像更新')
    update_record = {
        'timestamp': datetime.now().isoformat(),
        'reason': update_reason,
        'dimensions': dimension_scores.copy()
    }
    
    if profile:
        profile.major = standardized_profile['major']
        profile.knowledge_base = {'level': standardized_profile['knowledge_base'], 'text': dimension_texts['knowledge_base']}
        profile.learning_goal = dimension_texts['learning_goal'] or str(standardized_profile['learning_goal'])
        profile.learning_speed = dimension_texts['learning_speed'] or str(standardized_profile['learning_speed'])
        profile.weak_points = standardized_profile['weak_points']
        profile.cognitive_style = dimension_texts['cognitive_style'] or str(standardized_profile['cognitive_style'])
        profile.profile_json = standardized_profile
        
        history = profile.update_history or []
        history.append(update_record)
        if len(history) > 20:
            history = history[-20:]
        profile.update_history = history
        
        profile.updated_at = datetime.now()
    else:
        profile = StudentProfile(
            session_id=session_id,
            major=standardized_profile['major'],
            knowledge_base={'level': standardized_profile['knowledge_base'], 'text': dimension_texts['knowledge_base']},
            learning_goal=dimension_texts['learning_goal'] or str(standardized_profile['learning_goal']),
            learning_speed=dimension_texts['learning_speed'] or str(standardized_profile['learning_speed']),
            weak_points=standardized_profile['weak_points'],
            cognitive_style=dimension_texts['cognitive_style'] or str(standardized_profile['cognitive_style']),
            profile_json=standardized_profile,
            update_history=[update_record]
        )
        db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

def save_plan(db: Session, session_id: str, plan_data: list, update_reason: str = '首次生成'):
    existing_plans = db.query(LearningPlan).filter(LearningPlan.session_id == session_id).all()
    current_version = 1
    
    if existing_plans:
        versions = []
        for p in existing_plans:
            try:
                versions.append(p.plan_version)
            except Exception:
                versions.append(1)
        current_version = max(versions) + 1
    
    db.query(LearningPlan).filter(LearningPlan.session_id == session_id).delete()
    
    for step_data in plan_data:
        plan_data_with_version = {
            **step_data,
            'plan_version': current_version,
            'update_history': [{
                'timestamp': datetime.now().isoformat(),
                'version': current_version,
                'reason': update_reason,
                'step': step_data.get('step', 0),
                'title': step_data.get('title', ''),
                'status': step_data.get('status', 'pending')
            }]
        }
        
        plan = LearningPlan(
            session_id=session_id,
            week=step_data.get('week', step_data.get('step', 0)),
            title=step_data.get('title', ''),
            status=step_data.get('status', 'pending'),
            plan_json=plan_data_with_version
        )
        
        try:
            plan.step = step_data.get('step', 0)
        except Exception:
            pass
        
        try:
            plan.knowledge_point_name = step_data.get('knowledge_point_name', '')
        except Exception:
            pass
        
        try:
            plan.subject = step_data.get('subject', '')
        except Exception:
            pass
        
        try:
            plan.chapter = step_data.get('chapter', '')
        except Exception:
            pass
        
        try:
            plan.stage = step_data.get('stage', '')
        except Exception:
            pass
        
        try:
            plan.plan_version = current_version
        except Exception:
            pass
        
        db.add(plan)
    
    db.commit()
    return plan_data

def get_plan(db: Session, session_id: str):
    try:
        plans = db.query(LearningPlan).filter(LearningPlan.session_id == session_id).order_by(LearningPlan.step).all()
    except Exception:
        plans = db.query(LearningPlan).filter(LearningPlan.session_id == session_id).order_by(LearningPlan.id).all()
    
    result = []
    for plan in plans:
        data = plan.plan_json if plan.plan_json else {}
        data['id'] = plan.id
        data['step'] = plan.step if hasattr(plan, 'step') else (data.get('step') or data.get('week') or 0)
        data['week'] = plan.week if hasattr(plan, 'week') else data.get('week', 0)
        data['title'] = plan.title if plan.title else data.get('title', '')
        data['status'] = plan.status if plan.status else data.get('status', 'pending')
        data['plan_version'] = plan.plan_version if hasattr(plan, 'plan_version') else 1
        data['update_history'] = plan.update_history if hasattr(plan, 'update_history') else []
        result.append(data)
    return result

def get_plan_versions(db: Session, session_id: str):
    plans = db.query(LearningPlan).filter(LearningPlan.session_id == session_id).all()
    versions = []
    for p in plans:
        try:
            versions.append(p.plan_version)
        except Exception:
            versions.append(1)
    versions = sorted(set(versions))
    
    version_info = []
    for v in versions:
        v_plans = []
        for p in plans:
            try:
                if p.plan_version == v:
                    v_plans.append(p)
            except Exception:
                if v == 1:
                    v_plans.append(p)
        
        if v_plans:
            latest_time = max(p.created_at for p in v_plans)
            completed = sum(1 for p in v_plans if p.status == 'completed')
            total = len(v_plans)
            version_info.append({
                'version': v,
                'created_at': latest_time.isoformat(),
                'completed_steps': completed,
                'total_steps': total
            })
    return version_info

def update_plan_status(db: Session, session_id: str, step: int, status: str):
    try:
        plan = db.query(LearningPlan).filter(LearningPlan.session_id == session_id, LearningPlan.step == step).first()
    except Exception:
        plan = db.query(LearningPlan).filter(LearningPlan.session_id == session_id, LearningPlan.week == step).first()
    
    if plan:
        plan.status = status
        if plan.plan_json:
            plan.plan_json['status'] = status
        
        try:
            version_val = plan.plan_version
        except Exception:
            version_val = 1
        
        try:
            history_val = plan.update_history
        except Exception:
            history_val = []
        
        record = {
            'timestamp': datetime.now().isoformat(),
            'version': version_val,
            'reason': '学习进度更新',
            'step': step,
            'title': plan.title,
            'status': status
        }
        history = history_val or []
        history.append(record)
        if len(history) > 20:
            history = history[-20:]
        
        try:
            plan.update_history = history
        except Exception:
            pass
        
        db.commit()
        return True
    return False

def save_mistake(db: Session, session_id: str, mistake_data: dict):
    mistake = MistakeRecord(
        session_id=session_id,
        question=mistake_data.get('question', ''),
        user_answer=mistake_data.get('user_answer', ''),
        correct_answer=mistake_data.get('correct_answer', ''),
        analysis=mistake_data.get('analysis', ''),
        error_tags=mistake_data.get('error_tags', []),
        related_knowledge=mistake_data.get('related_knowledge', ''),
        subject=mistake_data.get('subject', ''),
        topic=mistake_data.get('topic', ''),
        reviewed=mistake_data.get('reviewed', False),
        review_count=mistake_data.get('review_count', 0)
    )
    db.add(mistake)
    db.commit()
    db.refresh(mistake)
    return mistake

def get_mistakes(db: Session, session_id: str):
    mistakes = db.query(MistakeRecord).filter(MistakeRecord.session_id == session_id).order_by(MistakeRecord.created_at.desc()).all()
    return [{
        'id': m.id,
        'question': m.question,
        'user_answer': m.user_answer,
        'correct_answer': m.correct_answer,
        'analysis': m.analysis,
        'error_tags': m.error_tags,
        'related_knowledge': m.related_knowledge,
        'subject': m.subject,
        'topic': m.topic,
        'reviewed': m.reviewed,
        'review_count': m.review_count,
        'created_at': m.created_at.isoformat()
    } for m in mistakes]

def mark_mistake_reviewed(db: Session, mistake_id: int):
    mistake = db.query(MistakeRecord).filter(MistakeRecord.id == mistake_id).first()
    if mistake:
        mistake.reviewed = True
        mistake.review_count = mistake.review_count + 1
        db.commit()
        return True
    return False

def mark_mistake_unreviewed(db: Session, mistake_id: int):
    mistake = db.query(MistakeRecord).filter(MistakeRecord.id == mistake_id).first()
    if mistake:
        mistake.reviewed = False
        mistake.review_count = mistake.review_count + 1
        db.commit()
        return True
    return False

def delete_mistake(db: Session, mistake_id: int):
    mistake = db.query(MistakeRecord).filter(MistakeRecord.id == mistake_id).first()
    if mistake:
        db.delete(mistake)
        db.commit()
        return True
    return False

def clear_mistakes(db: Session, session_id: str):
    db.query(MistakeRecord).filter(MistakeRecord.session_id == session_id).delete()
    db.commit()
    return True

def save_record(db: Session, session_id: str, record_data: dict):
    record = LearningRecord(
        session_id=session_id,
        type=record_data.get('type', ''),
        topic=record_data.get('topic', ''),
        detail=record_data.get('detail', ''),
        duration=record_data.get('duration', ''),
        score=record_data.get('score', 0.0)
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def get_records(db: Session, session_id: str):
    records = db.query(LearningRecord).filter(LearningRecord.session_id == session_id).order_by(LearningRecord.created_at.desc()).all()
    return [{
        'id': r.id,
        'type': r.type,
        'topic': r.topic,
        'detail': r.detail,
        'duration': r.duration,
        'score': r.score,
        'created_at': r.created_at.isoformat()
    } for r in records]

def save_resource(db: Session, session_id: str, resource_data: dict):
    resource = GeneratedResource(
        session_id=session_id,
        type=resource_data.get('type', ''),
        title=resource_data.get('title', ''),
        content=resource_data.get('content', ''),
        topic=resource_data.get('topic', '')
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource

def get_resources(db: Session, session_id: str):
    resources = db.query(GeneratedResource).filter(GeneratedResource.session_id == session_id).order_by(GeneratedResource.created_at.desc()).all()
    return [{
        'id': r.id,
        'type': r.type,
        'title': r.title,
        'content': r.content,
        'topic': r.topic,
        'created_at': r.created_at.isoformat()
    } for r in resources]

def save_message(db: Session, session_id: str, role: str, content: str, intent: str = ''):
    message = ChatMessage(
        session_id=session_id,
        role=role,
        content=content,
        intent=intent
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message

def get_messages(db: Session, session_id: str, limit: int = None):
    query = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at)
    if limit:
        query = query.limit(limit)
    messages = query.all()
    return [{
        'id': m.id,
        'role': m.role,
        'content': m.content,
        'intent': m.intent,
        'created_at': m.created_at.isoformat()
    } for m in messages]

def clear_messages(db: Session, session_id: str):
    db.query(ChatMessage).filter(ChatMessage.session_id == session_id).delete()
    db.commit()
    return True

def save_document(db: Session, session_id: str, doc_data: dict):
    doc = UploadedDocument(
        session_id=session_id,
        filename=doc_data.get('filename', ''),
        file_path=doc_data.get('file_path', ''),
        file_type=doc_data.get('file_type', ''),
        file_size=doc_data.get('file_size', 0),
        content=doc_data.get('content', ''),
        extracted_topics=doc_data.get('extracted_topics', []),
        full_analysis=doc_data.get('full_analysis', None),
        status=doc_data.get('status', 'pending'),
        topics_count=doc_data.get('topics_count', 0),
        query_count=doc_data.get('query_count', 0),
        subject=doc_data.get('subject', ''),
        chapter=doc_data.get('chapter', ''),
        source_type=doc_data.get('source_type', 'manual')
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

def get_documents(db: Session, session_id: str):
    docs = db.query(UploadedDocument).filter(UploadedDocument.session_id == session_id).order_by(UploadedDocument.created_at.desc()).all()
    return [{
        'id': d.id,
        'filename': d.filename,
        'file_type': d.file_type,
        'file_size': d.file_size,
        'extracted_topics': d.extracted_topics,
        'status': d.status,
        'topics_count': d.topics_count,
        'query_count': d.query_count,
        'subject': d.subject,
        'chapter': d.chapter,
        'source_type': d.source_type,
        'created_at': d.created_at.isoformat()
    } for d in docs]

def get_document_content(db: Session, doc_id: int):
    doc = db.query(UploadedDocument).filter(UploadedDocument.id == doc_id).first()
    if doc:
        return {
            'id': doc.id,
            'filename': doc.filename,
            'file_type': doc.file_type,
            'file_size': doc.file_size,
            'content': doc.content,
            'extracted_topics': doc.extracted_topics,
            'full_analysis': doc.full_analysis,
            'status': doc.status,
            'topics_count': doc.topics_count,
            'subject': doc.subject,
            'chapter': doc.chapter,
            'source_type': doc.source_type,
            'created_at': doc.created_at.isoformat()
        }
    return None

def delete_document(db: Session, doc_id: int):
    doc = db.query(UploadedDocument).filter(UploadedDocument.id == doc_id).first()
    if doc:
        db.delete(doc)
        db.commit()
        return True
    return False

def save_question(db: Session, session_id: str, question_data: dict):
    question = QuestionBank(
        session_id=session_id,
        subject=question_data.get('subject', ''),
        topic=question_data.get('topic', ''),
        question=question_data.get('question', ''),
        question_type=question_data.get('question_type', 'choice'),
        options=question_data.get('options', []),
        correct_answer=question_data.get('correct_answer', ''),
        analysis=question_data.get('analysis', ''),
        difficulty=question_data.get('difficulty', 'medium'),
        error_tags=question_data.get('error_tags', []),
        related_document_id=question_data.get('related_document_id', 0),
        generated_from=question_data.get('generated_from', 'agent')
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question

def get_questions(db: Session, session_id: str):
    questions = db.query(QuestionBank).filter(QuestionBank.session_id == session_id).order_by(QuestionBank.created_at.desc()).all()
    return [{
        'id': q.id,
        'subject': q.subject,
        'topic': q.topic,
        'question': q.question,
        'question_type': q.question_type,
        'options': q.options,
        'correct_answer': q.correct_answer,
        'analysis': q.analysis,
        'difficulty': q.difficulty,
        'error_tags': q.error_tags,
        'related_document_id': q.related_document_id,
        'generated_from': q.generated_from,
        'created_at': q.created_at.isoformat()
    } for q in questions]

def get_question_by_id(db: Session, question_id: int):
    question = db.query(QuestionBank).filter(QuestionBank.id == question_id).first()
    if question:
        return {
            'id': question.id,
            'subject': question.subject,
            'topic': question.topic,
            'question': question.question,
            'question_type': question.question_type,
            'options': question.options,
            'correct_answer': question.correct_answer,
            'analysis': question.analysis,
            'difficulty': question.difficulty,
            'error_tags': question.error_tags,
            'related_document_id': question.related_document_id,
            'generated_from': question.generated_from,
            'created_at': question.created_at.isoformat()
        }
    return None

def update_mistake(db: Session, mistake_id: int, update_data: dict):
    mistake = db.query(MistakeRecord).filter(MistakeRecord.id == mistake_id).first()
    if mistake:
        if 'question' in update_data:
            mistake.question = update_data['question']
        if 'question_type' in update_data:
            mistake.question_type = update_data['question_type']
        if 'user_answer' in update_data:
            mistake.user_answer = update_data['user_answer']
        if 'correct_answer' in update_data:
            mistake.correct_answer = update_data['correct_answer']
        if 'analysis' in update_data:
            mistake.analysis = update_data['analysis']
        if 'error_tags' in update_data:
            mistake.error_tags = update_data['error_tags']
        if 'error_detail' in update_data:
            mistake.error_detail = update_data['error_detail']
        if 'related_knowledge' in update_data:
            mistake.related_knowledge = update_data['related_knowledge']
        if 'subject' in update_data:
            mistake.subject = update_data['subject']
        if 'topic' in update_data:
            mistake.topic = update_data['topic']
        if 'difficulty' in update_data:
            mistake.difficulty = update_data['difficulty']
        if 'related_document_id' in update_data:
            mistake.related_document_id = update_data['related_document_id']
        if 'source_type' in update_data:
            mistake.source_type = update_data['source_type']
        db.commit()
        db.refresh(mistake)
        return mistake
    return None

def save_mistake_full(db: Session, session_id: str, mistake_data: dict):
    mistake = MistakeRecord(
        session_id=session_id,
        question_id=mistake_data.get('question_id', 0),
        question=mistake_data.get('question', ''),
        question_type=mistake_data.get('question_type', 'choice'),
        user_answer=mistake_data.get('user_answer', ''),
        correct_answer=mistake_data.get('correct_answer', ''),
        analysis=mistake_data.get('analysis', ''),
        error_tags=mistake_data.get('error_tags', []),
        error_detail=mistake_data.get('error_detail', ''),
        related_knowledge=mistake_data.get('related_knowledge', ''),
        subject=mistake_data.get('subject', ''),
        topic=mistake_data.get('topic', ''),
        difficulty=mistake_data.get('difficulty', 'medium'),
        reviewed=mistake_data.get('reviewed', False),
        review_count=mistake_data.get('review_count', 0),
        related_document_id=mistake_data.get('related_document_id', 0),
        source_type=mistake_data.get('source_type', 'agent')
    )
    db.add(mistake)
    db.commit()
    db.refresh(mistake)
    return mistake

def get_mistakes_full(db: Session, session_id: str):
    mistakes = db.query(MistakeRecord).filter(MistakeRecord.session_id == session_id).order_by(MistakeRecord.created_at.desc()).all()
    return [{
        'id': m.id,
        'question_id': m.question_id,
        'question': m.question,
        'question_type': m.question_type,
        'user_answer': m.user_answer,
        'correct_answer': m.correct_answer,
        'analysis': m.analysis,
        'error_tags': m.error_tags,
        'error_detail': m.error_detail,
        'related_knowledge': m.related_knowledge,
        'subject': m.subject,
        'topic': m.topic,
        'difficulty': m.difficulty,
        'reviewed': m.reviewed,
        'review_count': m.review_count,
        'related_document_id': m.related_document_id,
        'source_type': m.source_type,
        'created_at': m.created_at.isoformat()
    } for m in mistakes]

def get_mistakes_by_subject(db: Session, session_id: str, subject: str):
    mistakes = db.query(MistakeRecord).filter(MistakeRecord.session_id == session_id, MistakeRecord.subject == subject).order_by(MistakeRecord.created_at.desc()).all()
    return [{
        'id': m.id,
        'question_id': m.question_id,
        'question': m.question,
        'question_type': m.question_type,
        'user_answer': m.user_answer,
        'correct_answer': m.correct_answer,
        'analysis': m.analysis,
        'error_tags': m.error_tags,
        'error_detail': m.error_detail,
        'related_knowledge': m.related_knowledge,
        'subject': m.subject,
        'topic': m.topic,
        'difficulty': m.difficulty,
        'reviewed': m.reviewed,
        'review_count': m.review_count,
        'related_document_id': m.related_document_id,
        'source_type': m.source_type,
        'created_at': m.created_at.isoformat()
    } for m in mistakes]

def get_mistakes_stats(db: Session, session_id: str):
    mistakes = db.query(MistakeRecord).filter(MistakeRecord.session_id == session_id).all()
    records = db.query(LearningRecord).filter(LearningRecord.session_id == session_id).all()
    
    total_answered = 0
    correct_count = 0
    
    for record in records:
        if record.type == 'question' or record.type == 'exam':
            total_answered += 1
            if record.score and record.score >= 60:
                correct_count += 1
    
    wrong_count = len(mistakes)
    total_count = correct_count + wrong_count
    
    return {
        'total': total_count,
        'correct': correct_count,
        'wrong': wrong_count,
        'rate': round((correct_count / total_count) * 100) if total_count > 0 else 0
    }

def get_daily_trend(db: Session, session_id: str, days: int = 7):
    from datetime import timedelta
    today = datetime.now()
    
    saturday_offset = (today.weekday() - 5) % 7
    if saturday_offset == 0 and today.weekday() != 5:
        saturday_offset = 7
    this_saturday = today - timedelta(days=saturday_offset)
    
    day_order = ['周六', '周日', '周一', '周二', '周三', '周四', '周五']
    trend = []
    
    for i in range(days):
        date = this_saturday + timedelta(days=i)
        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        day_records = db.query(LearningRecord).filter(
            LearningRecord.session_id == session_id,
            LearningRecord.created_at >= start_of_day,
            LearningRecord.created_at <= end_of_day,
            LearningRecord.type.in_(['question', 'exam'])
        ).all()
        
        day_mistakes = db.query(MistakeRecord).filter(
            MistakeRecord.session_id == session_id,
            MistakeRecord.created_at >= start_of_day,
            MistakeRecord.created_at <= end_of_day
        ).all()
        
        correct = sum(1 for r in day_records if r.score and r.score >= 60)
        wrong = len(day_mistakes)
        total = correct + wrong
        
        rate = round((correct / total) * 100) if total > 0 else 0
        trend.append({
            'date': date.strftime('%Y-%m-%d'),
            'day': day_order[i],
            'correct': correct,
            'wrong': wrong,
            'total': total,
            'rate': rate
        })
    
    return trend

def save_knowledge_point(db: Session, point_data: dict):
    point = KnowledgePoint(
        document_id=point_data.get('document_id', 0),
        session_id=point_data.get('session_id', ''),
        subject=point_data.get('subject', ''),
        chapter=point_data.get('chapter', ''),
        name=point_data.get('name', ''),
        definition=point_data.get('definition', ''),
        difficulty=point_data.get('difficulty', 'medium'),
        is_key=point_data.get('is_key', False),
        is_exam_point=point_data.get('is_exam_point', False),
        error_tags=point_data.get('error_tags', []),
        prerequisites=point_data.get('prerequisites', []),
        structured_data=point_data.get('structured_data', {})
    )
    db.add(point)
    db.commit()
    return point

def get_knowledge_points_by_document(db: Session, document_id: int):
    return db.query(KnowledgePoint).filter(KnowledgePoint.document_id == document_id).all()

def get_knowledge_points(db: Session, session_id: str):
    return db.query(KnowledgePoint).filter(KnowledgePoint.session_id == session_id).all()

def delete_knowledge_points_by_document(db: Session, document_id: int):
    db.query(KnowledgePoint).filter(KnowledgePoint.document_id == document_id).delete()
    db.commit()

def clear_all_knowledge_points(db: Session, session_id: int):
    db.query(KnowledgePoint).filter(KnowledgePoint.session_id == session_id).delete()
    db.commit()

def update_knowledge_point(db: Session, point_id: int, point_data: dict):
    point = db.query(KnowledgePoint).filter(KnowledgePoint.id == point_id).first()
    if point:
        point.name = point_data.get('name', point.name)
        point.definition = point_data.get('definition', point.definition)
        point.difficulty = point_data.get('difficulty', point.difficulty)
        point.is_key = point_data.get('is_key', point.is_key)
        point.is_exam_point = point_data.get('is_exam_point', point.is_exam_point)
        point.error_tags = point_data.get('error_tags', point.error_tags)
        point.prerequisites = point_data.get('prerequisites', point.prerequisites)
        point.structured_data = point_data.get('structured_data', point.structured_data)
        db.commit()
    return point

def get_knowledge_stats(db: Session, session_id: str):
    docs = db.query(UploadedDocument).filter(UploadedDocument.session_id == session_id).all()
    points = db.query(KnowledgePoint).filter(KnowledgePoint.session_id == session_id).all()
    
    subjects = {}
    difficulties = {}
    
    for point in points:
        if point.subject:
            subjects[point.subject] = (subjects.get(point.subject) or 0) + 1
        if point.difficulty:
            difficulties[point.difficulty] = (difficulties.get(point.difficulty) or 0) + 1
    
    processed_docs = sum(1 for doc in docs if doc.status == 'processed')
    
    return {
        'total_docs': len(docs),
        'processed_docs': processed_docs,
        'total_topics': len(points),
        'subject_count': len(subjects),
        'subject_distribution': [{'subject': k, 'count': v} for k, v in subjects.items()],
        'difficulty_distribution': [{'difficulty': k, 'count': v} for k, v in difficulties.items()]
    }
