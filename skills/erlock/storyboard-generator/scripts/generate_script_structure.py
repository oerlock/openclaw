#!/usr/bin/env python3
"""
剧本结构生成脚本
将输入的故事文本转换为三幕式剧本结构，并提取故事元数据
"""

import json
import sys
import re
from pathlib import Path

def extract_story_metadata(story_text: str) -> dict:
    """从故事文本中提取基本元数据"""
    # 尝试从第一行提取标题
    lines = story_text.strip().split('\n')
    title = lines[0].strip() if lines else "Untitled Story"
    
    # 移除可能的标题标记
    if title.startswith('#'):
        title = title[1:].strip()
    
    # 估算字数和段落数
    word_count = len(story_text.split())
    paragraph_count = len([p for p in story_text.split('\n\n') if p.strip()])
    
    return {
        "title": title,
        "word_count": word_count,
        "paragraph_count": paragraph_count
    }

def analyze_story_structure(story_text: str, metadata: dict) -> dict:
    """
    分析故事文本并生成三幕式结构
    
    Args:
        story_text: 输入的故事文本
        metadata: 故事元数据
        
    Returns:
        包含剧本结构的字典
    """
    # 这里应该调用AI模型来分析故事结构
    # 为了示例，返回一个基于故事长度的智能结构
    
    title = metadata["title"]
    word_count = metadata["word_count"]
    
    # 根据故事长度调整结构复杂度
    if word_count < 500:
        # 短故事 - 简化结构
        structure = {
            "title": title,
            "word_count": word_count,
            "act_1": {
                "setup": f"{title} 的开端：介绍主要角色和初始情境",
                "inciting_incident": "引发主要冲突的关键事件"
            },
            "act_2": {
                "confrontation": "主角面临的挑战和障碍",
                "midpoint": "故事转折点"
            },
            "act_3": {
                "climax": "故事高潮和主要冲突解决",
                "resolution": "结局和后续"
            }
        }
    elif word_count < 2000:
        # 中等长度故事 - 标准三幕式
        structure = {
            "title": title,
            "word_count": word_count,
            "act_1": {
                "setup": f"{title} 的世界构建：角色、环境和背景设定",
                "inciting_incident": "打破平衡的事件，推动故事发展"
            },
            "act_2": {
                "confrontation": "主角面对的升级挑战和障碍",
                "midpoint": "重大转折或启示，改变故事方向"
            },
            "act_3": {
                "climax": "最终对决或决定性时刻",
                "resolution": "冲突解决和故事收尾"
            }
        }
    else:
        # 长篇故事 - 复杂结构
        structure = {
            "title": title,
            "word_count": word_count,
            "act_1": {
                "setup": f"{title} 的详细世界构建：多角色介绍、复杂背景设定",
                "inciting_incident": "复杂的触发事件，影响多个角色"
            },
            "act_2": {
                "confrontation": "多层次的冲突和挑战，角色发展弧线",
                "midpoint": "重大转折点，可能包含多个子情节的交汇"
            },
            "act_3": {
                "climax": "高潮迭起的最终解决，所有线索汇聚",
                "resolution": "完整的结局，包含主要角色的命运"
            }
        }
    
    return structure

def sanitize_filename(title: str) -> str:
    """清理标题以用作文件名"""
    # 移除非法字符
    sanitized = re.sub(r'[<>:"/\\|?*]', '_', title)
    # 限制长度
    if len(sanitized) > 50:
        sanitized = sanitized[:50]
    return sanitized.strip()

def main():
    if len(sys.argv) != 3:
        print("Usage: generate_script_structure.py <input_story_file> <output_structure_file>")
        print("Example: generate_script_structure.py ./input/story.txt ./output/script_structure.json")
        sys.exit(1)
    
    input_file = Path(sys.argv[1])
    output_file = Path(sys.argv[2])
    
    if not input_file.exists():
        print(f"Error: Input file {input_file} does not exist")
        sys.exit(1)
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            story_text = f.read()
        
        if not story_text.strip():
            print(f"Error: Input file {input_file} is empty")
            sys.exit(1)
        
        # 提取元数据
        metadata = extract_story_metadata(story_text)
        
        # 生成结构
        structure = analyze_story_structure(story_text, metadata)
        
        # 添加文件名安全的标题
        structure["safe_title"] = sanitize_filename(structure["title"])
        
        # 创建输出目录
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        # 保存结果
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(structure, f, ensure_ascii=False, indent=2)
        
        print(f"✓ Script structure generated successfully: {output_file}")
        print(f"  Title: {structure['title']}")
        print(f"  Word count: {structure['word_count']}")
        
    except Exception as e:
        print(f"Error processing story: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()