-- 1. 用户表
CREATE TABLE IF NOT EXISTS zhinote_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    nickname VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- 2. 密码重置令牌表
CREATE TABLE IF NOT EXISTS zhinote_password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES zhinote_users(id) ON DELETE CASCADE
);

-- 3. 文档表
CREATE TABLE IF NOT EXISTS zhinote_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    content LONGTEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. 音频记录表
CREATE TABLE IF NOT EXISTS zhinote_audio_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    transcript_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. 文本输入表
CREATE TABLE IF NOT EXISTS zhinote_text_inputs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content LONGTEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. 笔记表
CREATE TABLE IF NOT EXISTS zhinote_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. 自动笔记表
CREATE TABLE IF NOT EXISTS zhinote_auto_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source_id INT,
    source_type VARCHAR(20),
    title VARCHAR(255),
    content LONGTEXT,
    structure JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. AI分析表
CREATE TABLE IF NOT EXISTS zhinote_ai_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source_id INT,
    source_type VARCHAR(20),
    analysis_type VARCHAR(50),
    result JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. 分析表
CREATE TABLE IF NOT EXISTS zhinote_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doc_id INT,
    keywords TEXT,
    is_exam_point TINYINT(1) DEFAULT 0,
    importance INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. 知识点表
CREATE TABLE IF NOT EXISTS zhinote_knowledge_points (
    id INT AUTO_INCREMENT PRIMARY KEY,
    note_id INT,
    content TEXT,
    importance INT DEFAULT 0,
    category_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (note_id) REFERENCES zhinote_notes(id) ON DELETE CASCADE
);

-- 11. 知识分类表
CREATE TABLE IF NOT EXISTS zhinote_knowledge_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. 知识图谱节点表
CREATE TABLE IF NOT EXISTS zhinote_knowledge_graph_nodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    note_id INT,
    node_type VARCHAR(50),
    content TEXT,
    importance INT DEFAULT 0,
    is_user_created TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (note_id) REFERENCES zhinote_notes(id) ON DELETE CASCADE
);

-- 13. 知识图谱边表
CREATE TABLE IF NOT EXISTS zhinote_knowledge_graph_edges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    note_id INT,
    source_node_id INT,
    target_node_id INT,
    relationship_type VARCHAR(50),
    strength FLOAT DEFAULT 0.5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (note_id) REFERENCES zhinote_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (source_node_id) REFERENCES zhinote_knowledge_graph_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_node_id) REFERENCES zhinote_knowledge_graph_nodes(id) ON DELETE CASCADE
);

-- 14. 学习计划表
CREATE TABLE IF NOT EXISTS zhinote_learning_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_date DATE,
    completed TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 15. 学习统计表
CREATE TABLE IF NOT EXISTS zhinote_study_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    study_date DATE NOT NULL UNIQUE,
    study_duration INT DEFAULT 0,
    review_count INT DEFAULT 0,
    task_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 16. 导出记录表
CREATE TABLE IF NOT EXISTS zhinote_export_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    note_id INT,
    export_type VARCHAR(20),
    export_path VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (note_id) REFERENCES zhinote_notes(id) ON DELETE CASCADE
);

-- 17. 提醒表
CREATE TABLE IF NOT EXISTS zhinote_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    reminder_time DATETIME NOT NULL,
    is_completed TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES zhinote_users(id) ON DELETE CASCADE
);

-- 18. 学校推荐表
CREATE TABLE IF NOT EXISTS zhinote_schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(100),
    ranking INT,
    type VARCHAR(50),
    min_score INT,
    majors TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 19. 音频文件表
CREATE TABLE IF NOT EXISTS zhinote_audio_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(255),
    duration INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);