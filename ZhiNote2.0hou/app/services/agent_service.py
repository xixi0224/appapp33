import json
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from sparkai.llm.llm import ChatSparkLLM
    from sparkai.core.messages import ChatMessage
    USE_SPARK = True
except ImportError:
    USE_SPARK = False

from app.config import (
    SPARKAI_APP_ID,
    SPARKAI_API_KEY,
    SPARKAI_API_SECRET,
    SPARKAI_URL,
    SPARKAI_DOMAIN,
    DASHSCOPE_API_KEY,
    DASHSCOPE_MODEL
)

_agent_status = []

def call_llm(prompt, system_prompt="", response_format="text"):
    try:
        if DASHSCOPE_API_KEY:
            import dashscope
            from dashscope import Generation
            dashscope.api_key = DASHSCOPE_API_KEY
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
            
            params = {
                "model": DASHSCOPE_MODEL,
                "messages": messages,
                "result_format": "message"
            }
            
            if response_format == "json":
                params["response_format"] = {"type": "json_object"}
            
            print(f"Calling LLM with params: {params}")
            response = Generation.call(**params)
            print(f"LLM Response: {response}")
            
            if response.status_code == 200:
                return response.output.choices[0].message.content
            else:
                print(f"LLM Error: {response.message}")
                return ""
        elif USE_SPARK and SPARKAI_APP_ID and SPARKAI_API_KEY and SPARKAI_API_SECRET:
            spark = ChatSparkLLM(
                spark_api_url=SPARKAI_URL,
                spark_app_id=SPARKAI_APP_ID,
                spark_api_key=SPARKAI_API_KEY,
                spark_api_secret=SPARKAI_API_SECRET,
                spark_llm_domain=SPARKAI_DOMAIN,
                streaming=False,
            )
            
            messages = []
            if system_prompt:
                messages.append(ChatMessage(role='system', content=system_prompt))
            messages.append(ChatMessage(role='user', content=prompt))
            
            response = spark.generate([messages])
            return response.generations[0][0].text
            
    except Exception as e:
        print(f"LLM Error: {e}")
        return ""

def add_agent_status(name, status, detail=""):
    _agent_status.append({
        "agent": name,
        "status": status,
        "detail": detail,
        "timestamp": str(__import__('datetime').datetime.now())
    })
    if len(_agent_status) > 20:
        _agent_status.pop(0)

class ProfileAgent:
    def analyze(self, input_text):
        add_agent_status("Learning Portrait Agent", "running", "Analyzing user input...")
        
        prompt = """
你是一位专业的学习分析师，请从用户输入中提取学习画像。

用户输入：
%s

要求：
1. 严格输出JSON格式，不要包含任何额外文字
2. 必须包含以下6个维度的数值评分（0-100）：
   - knowledge_base: 知识基础（整体掌握程度、薄弱知识点）
   - learning_goal: 学习目标（应试/考研/就业/兴趣、周期计划）
   - learning_speed: 学习速度（新知识接受快慢、学习节奏）
   - error_patterns: 易错点偏好（高频错误类型、常见误区）
   - cognitive_style: 认知风格（理解型/记忆型/实践动手型）
   - interest_direction: 兴趣方向（所属专业、偏好学习内容）
3. 同时包含以下描述字段：
   - name: 学生姓名（默认"学生"）
   - major: 专业方向
   - knowledge_base_text: 知识基础文字描述（如"中级"、"有一定编程基础"）
   - learning_goal_text: 学习目标文字描述（如"考研"、"就业"）
   - learning_speed_text: 学习速度文字描述（如"快速"、"正常"）
   - cognitive_style_text: 认知风格文字描述（如"实践动手型"）
   - interest_direction_text: 兴趣方向文字描述（如"人工智能"）
   - weak_points: 薄弱知识点数组
   - ai_summary: 学情描述总结（100-200字，综合描述学生整体学习情况）

输出示例：
{
  "name": "学生",
  "major": "计算机科学",
  "knowledge_base": 65,
  "knowledge_base_text": "中级水平，有一定编程基础",
  "learning_goal": 75,
  "learning_goal_text": "考研深造",
  "learning_speed": 60,
  "learning_speed_text": "正常",
  "error_patterns": 40,
  "cognitive_style": 75,
  "cognitive_style_text": "实践动手型",
  "interest_direction": 80,
  "interest_direction_text": "人工智能",
  "weak_points": ["概率统计", "梯度下降"],
  "ai_summary": "该学生为计算机科学专业学生，知识基础处于中级水平，有一定编程基础。学习目标明确为考研深造，学习速度正常，属于实践动手型学习者，对人工智能领域有浓厚兴趣。需要重点加强概率统计和梯度下降等薄弱知识点的学习。"
}
""" % input_text
        
        system_prompt = "你是一位严谨的教育AI助手，请只输出JSON格式。"
        response = call_llm(prompt, system_prompt, "json")
        
        try:
            profile = json.loads(response)
            add_agent_status("Learning Portrait Agent", "completed", "Profile generated")
            return profile
        except:
            add_agent_status("Learning Portrait Agent", "error", "JSON parse failed")
            return {
                "name": "Student",
                "major": "Unknown",
                "knowledge_base": {"Python": "Unknown", "Math": "Unknown", "MachineLearning": "Unknown"},
                "learning_goal": "Unknown",
                "learning_style": "Balanced",
                "cognitive_features": "Unknown",
                "weak_points": [],
                "learning_speed": "Normal",
                "dimensions": {
                    "KnowledgeBase": 50,
                    "LearningAbility": 50,
                    "PracticalAbility": 50,
                    "TheoreticalAbility": 50,
                    "InterestDirection": 50,
                    "LearningHabits": 50
                }
            }

class PlanningAgent:
    def generate_plan(self, profile, knowledge_points=None):
        add_agent_status("Learning Planning Agent", "running", "Generating learning path...")
        
        if not knowledge_points or len(knowledge_points) == 0:
            add_agent_status("Learning Planning Agent", "error", "No knowledge points available")
            return []
        
        profile_str = json.dumps(profile, ensure_ascii=False)
        knowledge_str = json.dumps(knowledge_points, ensure_ascii=False)
        
        prompt = """
你是一位专业的学习规划师，请根据学生画像和知识库知识点生成个性化学习路径。

学生画像（6维能力）：
%s

知识库知识点（按依赖关系排序）：
%s

要求：
1. 严格输出JSON数组格式，不要包含任何额外文字
2. 学习路径按知识点依赖关系设计步骤，每步包含：
   - step: 步骤序号（从1开始）
   - week: 所属周数（如：1）
   - title: 知识点名称（中文）
   - knowledge_point_name: 知识点名称
   - subject: 所属科目
   - chapter: 所属章节
   - stage: 学习阶段（基础概念学习/核心原理学习/习题练习/进阶练习/项目实操）
   - goals: 学习目标数组（中文，具体可衡量）
   - resources: 配套资源数组，每个资源包含name（名称）和type（类型：document/mindmap/exercise/code）
   - estimated_time: 预计学习时长（小时）
   - prerequisites: 前置依赖知识点数组（步骤序号）
   - status: 完成状态（pending/in_progress/completed）
3. 学习路径要循序渐进，遵循知识点前置依赖关系
4. 根据学生画像6维能力调整学习节奏：
   - 知识基础低的学生：增加基础概念学习阶段
   - 学习速度慢的学生：延长每个步骤时间
   - 实践型认知风格：增加代码练习和项目实操
5. 至少生成8个步骤，覆盖从基础到进阶的完整学习路线

输出示例：
[
  {
    "step": 1,
    "week": 1,
    "title": "数据结构基础概念",
    "knowledge_point_name": "数据结构基础概念",
    "subject": "数据结构",
    "chapter": "第一章",
    "stage": "基础概念学习",
    "goals": ["理解数据结构基本概念", "掌握常见数据结构类型", "了解时间复杂度"],
    "resources": [
      {"name": "数据结构导论课件", "type": "document"},
      {"name": "数据结构思维导图", "type": "mindmap"},
      {"name": "基础概念习题", "type": "exercise"}
    ],
    "estimated_time": 8,
    "prerequisites": [],
    "status": "pending"
  },
  {
    "step": 2,
    "week": 1,
    "title": "线性表 - 数组与链表",
    "knowledge_point_name": "线性表",
    "subject": "数据结构",
    "chapter": "第二章",
    "stage": "核心原理学习",
    "goals": ["掌握数组和链表的实现原理", "理解插入删除操作", "分析时间复杂度"],
    "resources": [
      {"name": "线性表讲义", "type": "document"},
      {"name": "链表操作代码案例", "type": "code"},
      {"name": "链表习题集", "type": "exercise"}
    ],
    "estimated_time": 12,
    "prerequisites": [1],
    "status": "pending"
  }
]
""" % (profile_str, knowledge_str)
        
        system_prompt = "你是一位专业的学习规划师，请只输出JSON格式。"
        response = call_llm(prompt, system_prompt, "json")
        
        try:
            plan = json.loads(response)
            if isinstance(plan, list) and len(plan) > 0:
                add_agent_status("Learning Planning Agent", "completed", f"Generated {len(plan)} steps via AI")
                return plan
        except:
            print("AI generation failed, using fallback algorithm")
        
        return self._generate_fallback_plan(knowledge_points, profile)
    
    def _generate_fallback_plan(self, knowledge_points, profile):
        add_agent_status("Learning Planning Agent", "running", "Generating fallback plan...")
        
        point_name_to_idx = {kp['name']: i for i, kp in enumerate(knowledge_points)}
        
        stages = ['基础概念学习', '核心原理学习', '习题练习', '进阶练习', '项目实操']
        difficulty_time_map = {'easy': 6, 'medium': 10, 'hard': 14}
        
        plan = []
        step_num = 1
        week_num = 1
        steps_per_week = 2
        
        for kp in knowledge_points:
            prereq_steps = []
            for prereq_name in kp.get('prerequisites', []):
                if prereq_name in point_name_to_idx:
                    prereq_idx = point_name_to_idx[prereq_name]
                    if prereq_idx < point_name_to_idx[kp['name']]:
                        prereq_steps.append(prereq_idx + 1)
            
            difficulty = kp.get('difficulty', 'medium')
            estimated_time = difficulty_time_map.get(difficulty, 10)
            
            stage_idx = min(len(stages) - 1, step_num // 2)
            stage = stages[stage_idx]
            
            goals = [
                f"理解{kp['name']}的基本概念",
                f"掌握{kp['name']}的核心原理",
                f"能够应用{kp['name']}解决实际问题"
            ]
            
            resources = [
                {"name": f"{kp['name']}学习文档", "type": "document"},
                {"name": f"{kp['name']}思维导图", "type": "mindmap"},
                {"name": f"{kp['name']}练习题", "type": "exercise"}
            ]
            if difficulty in ['medium', 'hard']:
                resources.append({"name": f"{kp['name']}代码示例", "type": "code"})
            
            plan.append({
                "step": step_num,
                "week": week_num,
                "title": kp['name'],
                "knowledge_point_name": kp['name'],
                "subject": kp.get('subject', ''),
                "chapter": kp.get('chapter', ''),
                "stage": stage,
                "goals": goals,
                "resources": resources,
                "estimated_time": estimated_time,
                "prerequisites": prereq_steps,
                "status": "pending"
            })
            
            step_num += 1
            if step_num % steps_per_week == 1:
                week_num += 1
        
        add_agent_status("Learning Planning Agent", "completed", f"Generated {len(plan)} steps via fallback")
        return plan

class TeachingAgent:
    def explain(self, topic, profile):
        add_agent_status("Knowledge Teaching Agent", "running", f"Explaining: {topic}")
        
        profile_str = json.dumps(profile, ensure_ascii=False)
        
        prompt = """
你是一位专业的课程讲师，请用中文为学生讲解以下知识点。

知识点：%s

学生画像：
%s

要求：
1. 根据学生的知识基础和学习风格调整讲解深度
2. 使用通俗易懂的语言
3. 结构清晰：定义、核心原理、示例、常见误区
4. 输出Markdown格式
5. 内容详细

输出格式：
## %s

### 1. 定义
...

### 2. 核心原理
...

### 3. 示例
...

### 4. 常见误区
...
""" % (topic, profile_str, topic)
        
        system_prompt = "你是一位优秀的教育工作者，请用中文输出Markdown格式的讲解内容。"
        response = call_llm(prompt, system_prompt)
        
        add_agent_status("Knowledge Teaching Agent", "completed", f"Explained: {topic}")
        return response

class QuestionAgent:
    def generate_questions(self, topic, difficulty='medium', count=8):
        add_agent_status("Question Generation Agent", "running", f"Generating {difficulty} questions...")
        
        prompt = """
你是一位出题专家，请为以下知识点生成多样化的练习题。

知识点：%s
难度：%s
数量：%d

要求：
1. 严格输出JSON数组格式，不要包含任何Markdown代码块标记
2. 题目类型多样化，包含：选择题(choice)、填空题(fill)、简答题(essay)
3. 每个题目包含：
   - question: 题目内容（中文）
   - qtype: 题目类型（choice/fill/essay）
   - options: 选项数组（仅选择题有，格式为["选项A内容", "选项B内容", ...]，不含key）
   - answer: 正确答案（选择题填A/B/C/D，填空题填答案内容，简答题填详细解答）
   - explanation: 详细解析（中文）
   - difficulty: 难度等级（easy/medium/hard）

输出格式示例：
[
  {
    "question": "单项选择题题目内容",
    "qtype": "choice",
    "options": ["选项A内容", "选项B内容", "选项C内容", "选项D内容"],
    "answer": "B",
    "explanation": "详细解析说明",
    "difficulty": "medium"
  },
  {
    "question": "填空题：在线性回归中，最小二乘法的目标是______。",
    "qtype": "fill",
    "options": [],
    "answer": "最小化残差平方和",
    "explanation": "详细解析说明",
    "difficulty": "easy"
  },
  {
    "question": "简述什么是BLUE性质？",
    "qtype": "essay",
    "options": [],
    "answer": "BLUE是Best Linear Unbiased Estimator的缩写，即最优线性无偏估计量。在高斯-马尔可夫假设下，OLS估计量具有最小方差性。",
    "explanation": "详细解析说明",
    "difficulty": "hard"
  }
]
""" % (topic, difficulty, count)
        
        system_prompt = "你是一位严谨的教育AI助手，请只输出纯JSON格式，不要包含任何额外文字或标记。"
        response = call_llm(prompt, system_prompt, "json")
        
        try:
            questions = json.loads(response)
            add_agent_status("Question Generation Agent", "completed", f"Generated {len(questions)} questions")
            return questions
        except:
            add_agent_status("Question Generation Agent", "error", "JSON parse failed")
            return []

class ResourceAgent:
    def generate_document(self, topic):
        add_agent_status("Resource Generation Agent", "running", f"Generating document: {topic}")
        
        prompt = """
你是一位专业的教材编写者，请生成详细的知识点讲解文档。

知识点：%s

要求：
1. 结构清晰，分章节讲解
2. 内容详细：定义、原理、示例、常见误区
3. Markdown格式
4. 至少800字

输出格式：
# %s 详解指南

## 1. 概述
...

## 2. 核心原理
...

## 3. 示例代码
...

## 4. 常见误区
...

## 5. 学习建议
...
""" % (topic, topic)
        
        system_prompt = "你是一位专业的教育内容生成器，请用中文输出Markdown格式。"
        response = call_llm(prompt, system_prompt)
        
        add_agent_status("Resource Generation Agent", "completed", f"Document generated: {topic}")
        return response

    def generate_mindmap(self, topic):
        add_agent_status("Resource Generation Agent", "running", f"Generating mindmap: {topic}")
        
        prompt = """
你是一位思维导图专家，请为以下知识点生成Mermaid思维导图代码。

知识点：%s

要求：
1. 使用Mermaid mindmap语法
2. 至少3级结构
3. 分支名称使用中文
4. 只输出Mermaid代码

输出示例：
mindmap
  root((%s))
    分支1
      子分支1.1
      子分支1.2
    分支2
      子分支2.1
""" % (topic, topic)
        
        system_prompt = "你是一位思维导图专家，请只输出Mermaid代码。"
        response = call_llm(prompt, system_prompt)
        
        add_agent_status("Resource Generation Agent", "completed", f"Mindmap generated: {topic}")
        return response

    def generate_ppt(self, topic):
        add_agent_status("Resource Generation Agent", "running", f"Generating PPT outline: {topic}")
        
        prompt = """
你是一位PPT设计师，请为以下知识点生成PPT大纲。

知识点：%s

要求：
1. 严格输出JSON数组格式，不要包含Markdown代码块标记
2. 每张幻灯片包含：
   - title: 幻灯片标题（中文）
   - points: 3-5个要点（中文）
3. 至少8张幻灯片
4. 教学逻辑清晰

输出格式：
[
  {
    "title": "幻灯片1标题",
    "points": ["要点1", "要点2", "要点3"]
  }
]
""" % topic
        
        system_prompt = "你是一位专业的PPT设计师，请只输出纯JSON格式，不要包含其他文字。"
        response = call_llm(prompt, system_prompt, "json")
        
        if not response:
            add_agent_status("Resource Generation Agent", "error", "LLM response is empty")
            return json.dumps([])
        
        try:
            ppt = json.loads(response)
            add_agent_status("Resource Generation Agent", "completed", f"PPT generated {len(ppt)} slides")
            return json.dumps(ppt, ensure_ascii=False)
        except:
            add_agent_status("Resource Generation Agent", "error", "JSON parse failed, returning raw response")
            return response

    def generate_code(self, topic):
        add_agent_status("Resource Generation Agent", "running", f"Generating code: {topic}")
        
        prompt = """
你是一位编程导师，请为以下知识点生成Python代码示例。

知识点：%s

要求：
1. 完整可运行的代码
2. 详细的中文注释
3. Python代码块格式
4. 包含示例数据和输出说明
5. 具有实际意义

输出格式：
```python
# %s 示例
import ...

def example():
    '函数描述'
    # 实现代码
    ...

if __name__ == '__main__':
    # 测试
    ...
```
""" % (topic, topic)
        
        system_prompt = "你是一位专业的编程导师，请输出代码格式。"
        response = call_llm(prompt, system_prompt)
        
        add_agent_status("Resource Generation Agent", "completed", f"Code generated: {topic}")
        return response

    def generate_reading(self, topic):
        add_agent_status("Resource Generation Agent", "running", f"Generating reading materials: {topic}")
        
        prompt = """
你是一位学术研究员，请为以下知识点推荐拓展阅读材料。

知识点：%s

要求：
1. 严格输出JSON数组格式，不要包含Markdown代码块标记
2. 推荐至少5篇高质量阅读材料
3. 每篇包含：
   - title: 文章/书籍标题（中文）
   - author: 作者
   - source: 来源（期刊/出版社/网站）
   - summary: 内容摘要（中文，50-100字）
   - relevance: 相关性评分（1-5分）
   - type: 类型（学术论文/技术博客/书籍章节/综述）

输出格式：
[
  {
    "title": "文章标题",
    "author": "作者",
    "source": "来源",
    "summary": "内容摘要",
    "relevance": 5,
    "type": "学术论文"
  }
]
""" % topic
        
        system_prompt = "你是一位严谨的学术研究员，请只输出纯JSON格式，不要包含其他文字。"
        response = call_llm(prompt, system_prompt, "json")
        
        if not response:
            add_agent_status("Resource Generation Agent", "error", "LLM response is empty")
            return json.dumps([])
        
        try:
            reading = json.loads(response)
            add_agent_status("Resource Generation Agent", "completed", f"Reading materials generated: {len(reading)} items")
            return json.dumps(reading, ensure_ascii=False)
        except:
            add_agent_status("Resource Generation Agent", "error", "JSON parse failed, returning raw response")
            return response

    def generate_video_script(self, topic):
        add_agent_status("Resource Generation Agent", "running", f"Generating video script: {topic}")
        
        prompt = """
你是一位教学视频导演，请为以下知识点生成教学视频脚本。

知识点：%s

要求：
1. 严格输出JSON格式，不要包含Markdown代码块标记
2. 视频时长：5-8分钟
3. 包含：
   - title: 视频标题（中文）
   - duration: 预计时长（分钟）
   - scenes: 场景数组，每个场景包含：
     - time: 时间点（如0:00-1:30）
     - title: 场景标题
     - content: 讲解内容（中文）
     - visual: 画面描述（动画/图表/演示）
     - audio: 旁白脚本（中文）
4. 教学逻辑清晰，适合在线学习

输出格式：
{
  "title": "视频标题",
  "duration": 6,
  "scenes": [
    {
      "time": "0:00-1:00",
      "title": "开场介绍",
      "content": "讲解内容",
      "visual": "画面描述",
      "audio": "旁白脚本"
    }
  ]
}
""" % topic
        
        system_prompt = "你是一位专业的教学视频导演，请只输出纯JSON格式，不要包含其他文字。"
        response = call_llm(prompt, system_prompt, "json")
        
        if not response:
            add_agent_status("Resource Generation Agent", "error", "LLM response is empty")
            return json.dumps({})
        
        try:
            script = json.loads(response)
            add_agent_status("Resource Generation Agent", "completed", f"Video script generated: {len(script.get('scenes', []))} scenes")
            return json.dumps(script, ensure_ascii=False)
        except:
            add_agent_status("Resource Generation Agent", "error", "JSON parse failed, returning raw response")
            return response

    def generate_all(self, topic):
        return {
            "document": self.generate_document(topic),
            "mindmap": self.generate_mindmap(topic),
            "ppt": self.generate_ppt(topic),
            "code": self.generate_code(topic),
            "reading": self.generate_reading(topic),
            "video_script": self.generate_video_script(topic)
        }

class EvaluationAgent:
    def evaluate(self, answers, profile):
        add_agent_status("Learning Evaluation Agent", "running", "Evaluating learning...")
        
        answers_str = json.dumps(answers, ensure_ascii=False)
        profile_str = json.dumps(profile, ensure_ascii=False)
        
        prompt = """
你是一位评估专家，请批改学生答案并分析错误。

学生答案：
%s

学生画像：
%s

要求：
1. 严格输出JSON格式
2. 包含：
   - score: 分数（0-100）
   - correct_count: 正确数量
   - wrong_count: 错误数量
   - analysis: 对象，包含：
     - error_types: 错误类型数组（概念混淆、计算错误等）
     - weak_points: 薄弱知识点数组
     - suggestions: 改进建议数组
   - updated_profile: 更新后的维度分数

输出格式：
{
  "score": 80,
  "correct_count": 4,
  "wrong_count": 1,
  "analysis": {
    "error_types": ["概念混淆"],
    "weak_points": ["概率统计"],
    "suggestions": ["巩固基础知识", "多做练习"]
  },
  "updated_profile": {
    "KnowledgeBase": 65,
    "LearningAbility": 70,
    "PracticalAbility": 80,
    "TheoreticalAbility": 60,
    "InterestDirection": 85,
    "LearningHabits": 65
  }
}
""" % (answers_str, profile_str)
        
        system_prompt = "你是一位严谨的教育评估专家，请只输出JSON格式。"
        response = call_llm(prompt, system_prompt, "json")
        
        try:
            result = json.loads(response)
            add_agent_status("Learning Evaluation Agent", "completed", f"Score: {result.get('score', 0)}")
            return result
        except:
            add_agent_status("Learning Evaluation Agent", "error", "JSON parse failed")
            return {
                "score": 0,
                "correct_count": 0,
                "wrong_count": 0,
                "analysis": {
                    "error_types": [],
                    "weak_points": [],
                    "suggestions": []
                },
                "updated_profile": {}
            }

def run_workflow(input_text):
    results = {}
    
    add_agent_status("Workflow", "running", "Starting learning loop")
    
    profile_agent = ProfileAgent()
    results['profile'] = profile_agent.analyze(input_text)
    
    planning_agent = PlanningAgent()
    results['plan'] = planning_agent.generate_plan(results['profile'])
    
    resource_agent = ResourceAgent()
    goal = results['profile'].get('learning_goal', 'Machine Learning')
    results['resources'] = resource_agent.generate_all(goal)
    
    add_agent_status("Workflow", "completed", "Learning loop finished")
    
    return results

def get_agent_status():
    return _agent_status

def generate_recommendations(profile, plan=None):
    add_agent_status("Recommendation Agent", "running", "Generating recommendations...")
    
    try:
        if isinstance(profile, dict):
            profile_str = json.dumps(profile, ensure_ascii=False)
        elif hasattr(profile, 'profile_json'):
            profile_data = profile.profile_json if profile.profile_json else {}
            profile_str = json.dumps(profile_data, ensure_ascii=False)
        elif isinstance(profile, str):
            profile_str = profile
        else:
            profile_str = "{}"
    except Exception as e:
        print(f"Profile serialization error: {e}")
        profile_str = "{}"
    
    try:
        if plan and isinstance(plan, (list, dict)):
            plan_str = json.dumps(plan, ensure_ascii=False)
        elif plan and hasattr(plan, '__dict__'):
            plan_str = json.dumps(plan.__dict__, ensure_ascii=False)
        else:
            plan_str = ""
    except Exception as e:
        print(f"Plan serialization error: {e}")
        plan_str = ""
    
    prompt = """
你是一位专业的学习推荐专家，请根据学生的学习画像生成个性化学习资源推荐。

学生画像：
%s

当前学习计划：
%s

要求：
1. 严格输出JSON数组格式，不要包含Markdown代码块标记
2. 推荐至少5个学习资源
3. 每个推荐包含：
   - id: 唯一标识（数字）
   - type: 资源类型（文档/视频/练习/代码/文章）
   - title: 资源标题（中文）
   - description: 简要描述（中文）
   - relevance: 相关性评分（0-100）
   - priority: 推荐优先级（high/medium/low）
   - reason: 推荐理由（中文，说明为什么推荐这个资源）
4. 优先推荐针对薄弱知识点和学习目标的资源

输出格式：
[
  {
    "id": 1,
    "type": "document",
    "title": "资源标题",
    "description": "简要描述",
    "relevance": 95,
    "priority": "high",
    "reason": "基于薄弱点X推荐"
  }
]
""" % (profile_str, plan_str)
    
    system_prompt = "你是一位严谨的推荐专家，请只输出纯JSON格式，不要包含其他文字。"
    response = call_llm(prompt, system_prompt, "json")
    
    if not response:
        add_agent_status("Recommendation Agent", "error", "LLM response is empty")
        return []
    
    try:
        recommendations = json.loads(response)
        add_agent_status("Recommendation Agent", "completed", f"Generated {len(recommendations)} recommendations")
        return recommendations
    except Exception as e:
        print(f"JSON parse error: {e}, response: {response[:200]}")
        add_agent_status("Recommendation Agent", "error", f"JSON parse failed: {str(e)}")
        return []

def update_plan_based_on_evaluation(evaluation_result, profile, plan):
    add_agent_status("Planning Agent", "running", "Adjusting plan based on evaluation...")
    
    if not plan:
        add_agent_status("Planning Agent", "completed", "No plan to adjust")
        return []
    
    profile_str = json.dumps(profile, ensure_ascii=False)
    plan_str = json.dumps(plan, ensure_ascii=False)
    eval_str = json.dumps(evaluation_result, ensure_ascii=False)
    
    prompt = """
You are a professional learning planner. Adjust the learning plan based on evaluation results.

Student profile:
%s

Current plan:
%s

Evaluation result:
%s

Requirements:
1. Output strictly JSON array (same format as current plan)
2. Adjust based on weak points found
3. Add/replace resources for weak areas
4. Keep completed/in_progress items, adjust pending items
5. Return the full updated plan

Output format (same as plan):
[
  {
    "week": "Week 1",
    "title": "Topic",
    "goals": [...],
    "resources": [...],
    "estimated_time": 20,
    "status": "pending"
  }
]
""" % (profile_str, plan_str, eval_str)
    
    system_prompt = "You are a professional learning planner. Only output JSON format."
    response = call_llm(prompt, system_prompt, "json")
    
    try:
        updated_plan = json.loads(response)
        add_agent_status("Planning Agent", "completed", f"Plan adjusted: {len(updated_plan)} weeks")
        return updated_plan
    except:
        add_agent_status("Planning Agent", "error", "JSON parse failed")
        return plan

def complete_learning_loop(input_text, answers=None):
    results = {}
    
    add_agent_status("Learning Loop", "running", "Starting complete learning loop")
    
    profile_agent = ProfileAgent()
    results['profile'] = profile_agent.analyze(input_text)
    
    planning_agent = PlanningAgent()
    results['plan'] = planning_agent.generate_plan(results['profile'])
    
    resource_agent = ResourceAgent()
    goal = results['profile'].get('learning_goal', 'Machine Learning')
    results['resources'] = resource_agent.generate_all(goal)
    
    results['recommendations'] = generate_recommendations(results['profile'], results['plan'])
    
    if answers:
        evaluation_agent = EvaluationAgent()
        results['evaluation'] = evaluation_agent.evaluate(answers, results['profile'])
        results['updated_plan'] = update_plan_based_on_evaluation(results['evaluation'], results['profile'], results['plan'])
    
    add_agent_status("Learning Loop", "completed", "Complete learning loop finished")
    
    return results

def automated_learning_loop(mistakes_data, current_profile, current_plan):
    add_agent_status("Automated Learning Loop", "running", "Starting automated learning loop triggered by mistakes")
    
    results = {
        'profile_updated': False,
        'plan_adjusted': False
    }
    
    if not mistakes_data or len(mistakes_data) == 0:
        add_agent_status("Automated Learning Loop", "completed", "No mistakes data, loop skipped")
        return results
    
    mistakes_str = json.dumps(mistakes_data, ensure_ascii=False)
    profile_str = json.dumps(current_profile, ensure_ascii=False)
    
    add_agent_status("Profile Agent", "running", "Updating profile based on mistakes...")
    profile_agent = ProfileAgent()
    
    update_prompt = f"""
基于以下错题数据更新学生学习画像：

当前画像：
{profile_str}

错题数据：
{mistakes_str}

要求：
1. 分析错题中的薄弱知识点，更新weak_points数组
2. 根据错误类型调整error_patterns分数
3. 如果多次在同一知识点出错，降低对应知识维度分数
4. 输出更新后的完整画像JSON
"""
    
    system_prompt = "你是一位专业的学习分析师，请只输出JSON格式。"
    response = call_llm(update_prompt, system_prompt, "json")
    
    try:
        updated_profile = json.loads(response)
        add_agent_status("Profile Agent", "completed", "Profile updated automatically")
        results['updated_profile'] = updated_profile
        results['profile_updated'] = True
    except:
        add_agent_status("Profile Agent", "error", "Profile update failed, using current profile")
        results['updated_profile'] = current_profile
    
    if current_plan and results['profile_updated']:
        add_agent_status("Planning Agent", "running", "Adjusting plan based on updated profile...")
        planning_agent = PlanningAgent()
        updated_plan = planning_agent.generate_plan(results['updated_profile'])
        
        if updated_plan and len(updated_plan) > 0:
            add_agent_status("Planning Agent", "completed", "Plan adjusted automatically")
            results['updated_plan'] = updated_plan
            results['plan_adjusted'] = True
        else:
            add_agent_status("Planning Agent", "error", "Plan adjustment failed")
            results['updated_plan'] = current_plan
    
    add_agent_status("Automated Learning Loop", "completed", "Automated learning loop finished")
    
    return results

def extract_topics_from_document(content):
    add_agent_status("Document Analysis Agent", "running", "Extracting topics from document...")
    
    prompt = """
你是一个专业的教育文档分析专家。请对以下课程文档进行深度语义解析，提取结构化知识点数据。

文档内容：
%s

要求：
1. 严格输出JSON格式，不要包含任何额外文字，不要包含markdown代码块标记
2. 必须包含以下所有字段，不得遗漏：
   - core_topics: 核心知识点数组，至少提取5个，每个知识点是对象，包含title（知识点标题）和explanation（详细解释，不少于50字，包含定义、原理、应用等）
   - knowledge_framework: 知识框架对象，包含chapters数组，每个章节有title和children
   - key_difficulties: 重难点数组，至少提取3个，每个难点是对象，包含title（难点名称）和explanation（详细解释）
   - exam_points: 考点内容数组，至少提取3个，每个考点是对象，包含title（考点名称）和explanation（详细解释）
   - common_mistakes: 固有易错点数组，至少提取2个，每个易错点是对象，包含title（易错点名称）和explanation（详细解释）
   - basic_tags: 基础标签对象，包含course_name（课程名称）、subject（学科）、chapter（章节）、difficulty（难度标签）
   - difficulty_level: 综合难度级别，取值为beginner初级/intermediate中级/advanced高级
   - keywords: 重要关键词数组，至少提取5个

输出格式必须严格遵循以下JSON结构：
{
  "core_topics": [
    {"title": "知识点名称", "explanation": "详细解释内容，不少于50字"},
    {"title": "知识点名称", "explanation": "详细解释内容，不少于50字"}
  ],
  "knowledge_framework": {
    "chapters": [
      {"title": "章节标题", "children": ["小节1", "小节2"]}
    ]
  },
  "key_difficulties": [
    {"title": "难点名称", "explanation": "难点详细解释"},
    {"title": "难点名称", "explanation": "难点详细解释"}
  ],
  "exam_points": [
    {"title": "考点名称", "explanation": "考点详细解释"},
    {"title": "考点名称", "explanation": "考点详细解释"}
  ],
  "common_mistakes": [
    {"title": "易错点名称", "explanation": "易错点详细解释"},
    {"title": "易错点名称", "explanation": "易错点详细解释"}
  ],
  "basic_tags": {
    "course_name": "课程名称",
    "subject": "学科名称",
    "chapter": "章节名称",
    "difficulty": "难度描述"
  },
  "difficulty_level": "intermediate",
  "keywords": ["关键词1", "关键词2", "关键词3"]
}
""" % content
    
    system_prompt = "你是一个严谨的教育文档分析专家。只输出JSON格式，不要包含任何其他文字。"
    response = call_llm(prompt, system_prompt, "json")
    
    try:
        result = json.loads(response)
        
        def normalize_topics(topics):
            if isinstance(topics, list):
                normalized = []
                for t in topics:
                    if isinstance(t, str):
                        normalized.append({"title": t, "explanation": ""})
                    elif isinstance(t, dict):
                        normalized.append({
                            "title": t.get("title", t.get("name", "")),
                            "explanation": t.get("explanation", t.get("desc", ""))
                        })
                return normalized
            return []
        
        basic_tags = result.get('basic_tags', {"course_name": "", "subject": "", "chapter": "", "difficulty": ""})
        subject = basic_tags.get('subject', '')
        chapter = basic_tags.get('chapter', '')
        difficulty_map = {'beginner': 'easy', 'intermediate': 'medium', 'advanced': 'hard'}
        difficulty = difficulty_map.get(result.get('difficulty_level', 'intermediate'), 'medium')
        
        knowledge_points = []
        for topic in normalize_topics(result.get('core_topics', [])):
            is_key = False
            is_exam_point = False
            error_tags = []
            
            key_diff_titles = [kd.get('title', '') for kd in normalize_topics(result.get('key_difficulties', []))]
            exam_point_titles = [ep.get('title', '') for ep in normalize_topics(result.get('exam_points', []))]
            mistake_titles = [cm.get('title', '') for cm in normalize_topics(result.get('common_mistakes', []))]
            
            if topic.get('title', '') in key_diff_titles:
                is_key = True
            if topic.get('title', '') in exam_point_titles:
                is_exam_point = True
            if topic.get('title', '') in mistake_titles:
                error_tags = ['易错点']
            
            knowledge_points.append({
                'subject': subject,
                'chapter': chapter,
                'name': topic.get('title', ''),
                'definition': topic.get('explanation', ''),
                'difficulty': difficulty,
                'is_key': is_key,
                'is_exam_point': is_exam_point,
                'error_tags': error_tags,
                'prerequisites': []
            })
        
        normalized_result = {
            "core_topics": normalize_topics(result.get('core_topics', [])),
            "knowledge_framework": result.get('knowledge_framework', {"chapters": []}),
            "key_difficulties": normalize_topics(result.get('key_difficulties', [])),
            "exam_points": normalize_topics(result.get('exam_points', [])),
            "common_mistakes": normalize_topics(result.get('common_mistakes', [])),
            "basic_tags": basic_tags,
            "difficulty_level": result.get('difficulty_level', "intermediate"),
            "keywords": result.get('keywords', []),
            "knowledge_points": knowledge_points
        }
        
        topic_count = len(normalized_result['core_topics'])
        add_agent_status("Document Analysis Agent", "completed", f"提取了 {topic_count} 个核心知识点")
        return normalized_result
    except Exception as e:
        print(f"JSON parse error: {e}")
        add_agent_status("Document Analysis Agent", "error", "JSON解析失败")
        return {
            "core_topics": [],
            "knowledge_framework": {"chapters": []},
            "key_difficulties": [],
            "exam_points": [],
            "common_mistakes": [],
            "basic_tags": {"course_name": "", "subject": "", "chapter": "", "difficulty": ""},
            "difficulty_level": "intermediate",
            "keywords": []
        }

def ocr_analyze_image(image_text):
    add_agent_status("OCR Analysis Agent", "running", "Analyzing OCR text...")
    
    prompt = """
You are an OCR analysis expert. Analyze the text extracted from an image and identify questions.

OCR Text:
%s

Requirements:
1. Output strictly JSON format
2. Identify if there are any questions in the text
3. If questions found, extract them with answers
4. Include:
   - has_questions: boolean
   - questions: array of questions with answer
   - subject: estimated subject
   - difficulty: estimated difficulty

Output format:
{
  "has_questions": true,
  "questions": [
    {
      "question": "Question text",
      "answer": "Answer",
      "explanation": "Explanation"
    }
  ],
  "subject": "Math",
  "difficulty": "medium"
}
""" % image_text
    
    system_prompt = "You are a rigorous OCR analysis expert. Only output JSON format."
    response = call_llm(prompt, system_prompt, "json")
    
    try:
        result = json.loads(response)
        add_agent_status("OCR Analysis Agent", "completed", f"Found {len(result.get('questions', []))} questions")
        return result
    except:
        add_agent_status("OCR Analysis Agent", "error", "JSON parse failed")
        return {
            "has_questions": False,
            "questions": [],
            "subject": "",
            "difficulty": "medium"
        }
