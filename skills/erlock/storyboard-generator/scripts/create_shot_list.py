#!/usr/bin/env python3
"""
分镜脚本生成脚本
基于剧本结构生成详细的分镜列表，支持不同故事长度的镜头数量调整
"""

import json
import sys
from pathlib import Path

def generate_shots_for_act(act_data: dict, act_name: str, start_id: int) -> tuple:
    """
    为指定幕生成镜头
    
    Args:
        act_data: 幕的数据
        act_name: 幕的名称 (act_1, act_2, act_3)
        start_id: 起始镜头ID
        
    Returns:
        (镜头列表, 下一个可用ID)
    """
    shots = []
    current_id = start_id
    
    # 根据幕的不同生成相应的镜头
    if act_name == "act_1":
        # 第一幕：建立场景和角色
        shots.extend([
            {
                "shot_id": f"{current_id:03d}",
                "scene": act_name,
                "shot_type": "extreme_wide_shot",
                "description": "建立故事世界和环境",
                "duration": "4s",
                "camera_movement": "static"
            },
            {
                "shot_id": f"{current_id+1:03d}",
                "scene": act_name, 
                "shot_type": "wide_shot",
                "description": "主要角色介绍和环境互动",
                "duration": "3s",
                "camera_movement": "slow_pan"
            },
            {
                "shot_id": f"{current_id+2:03d}",
                "scene": act_name,
                "shot_type": "medium_shot",
                "description": "触发事件的关键时刻",
                "duration": "2s",
                "camera_movement": "static"
            }
        ])
        current_id += 3
        
    elif act_name == "act_2":
        # 第二幕：冲突和发展
        shots.extend([
            {
                "shot_id": f"{current_id:03d}",
                "scene": act_name,
                "shot_type": "medium_close_up",
                "description": "主角面对挑战的表情特写",
                "duration": "2s",
                "camera_movement": "static"
            },
            {
                "shot_id": f"{current_id+1:03d}",
                "scene": act_name,
                "shot_type": "over_the_shoulder",
                "description": "对话或对抗场景",
                "duration": "3s", 
                "camera_movement": "handheld"
            },
            {
                "shot_id": f"{current_id+2:03d}",
                "scene": act_name,
                "shot_type": "close_up",
                "description": "中点转折的关键细节",
                "duration": "1.5s",
                "camera_movement": "static"
            }
        ])
        current_id += 3
        
    elif act_name == "act_3":
        # 第三幕：高潮和结局
        shots.extend([
            {
                "shot_id": f"{current_id:03d}",
                "scene": act_name,
                "shot_type": "wide_shot",
                "description": "高潮场景全景展示",
                "duration": "3s",
                "camera_movement": "dolly_in"
            },
            {
                "shot_id": f"{current_id+1:03d}",
                "scene": act_name,
                "shot_type": "close_up",
                "description": "决定性时刻的情感特写",
                "duration": "2s",
                "camera_movement": "static"
            },
            {
                "shot_id": f"{current_id+2:03d}",
                "scene": act_name,
                "shot_type": "medium_shot",
                "description": "结局和角色状态展示",
                "duration": "3s",
                "camera_movement": "slow_pull_back"
            }
        ])
        current_id += 3
    
    return shots, current_id

def adjust_shot_count(shots: list, word_count: int) -> list:
    """根据故事长度调整镜头数量"""
    base_shot_count = len(shots)
    
    if word_count < 500:
        # 短故事 - 减少镜头
        return shots[:6] if len(shots) >= 6 else shots
    elif word_count > 2000:
        # 长故事 - 增加镜头（重复一些关键镜头类型）
        extended_shots = shots.copy()
        # 为每个幕添加额外的镜头
        for i, shot in enumerate(shots):
            if i % 3 == 0 and len(extended_shots) < 15:  # 每3个镜头添加一个
                extra_shot = shot.copy()
                extra_shot["shot_id"] = f"{int(shot['shot_id']) + 100:03d}"
                extra_shot["description"] += " (additional detail)"
                extended_shots.insert(i + 1, extra_shot)
        return extended_shots[:15]
    else:
        # 中等长度 - 保持原样
        return shots

def generate_shot_list(script_structure: dict) -> list:
    """
    基于剧本结构生成分镜列表
    
    Args:
        script_structure: 剧本结构字典
        
    Returns:
        分镜列表，每个分镜包含详细信息
    """
    shots = []
    current_id = 1
    word_count = script_structure.get("word_count", 1000)
    
    # 为每一幕生成镜头
    for act_name in ["act_1", "act_2", "act_3"]:
        if act_name in script_structure:
            act_shots, current_id = generate_shots_for_act(
                script_structure[act_name], act_name, current_id
            )
            shots.extend(act_shots)
    
    # 根据故事长度调整镜头数量
    shots = adjust_shot_count(shots, word_count)
    
    # 更新镜头ID以确保连续性
    for i, shot in enumerate(shots):
        shot["shot_id"] = f"{i+1:03d}"
    
    return shots

def main():
    if len(sys.argv) != 3:
        print("Usage: create_shot_list.py <input_script_file> <output_shots_file>")
        print("Example: create_shot_list.py ./output/script_structure.json ./output/shot_list.json")
        sys.exit(1)
    
    input_file = Path(sys.argv[1])
    output_file = Path(sys.argv[2])
    
    if not input_file.exists():
        print(f"Error: Input file {input_file} does not exist")
        sys.exit(1)
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            script_structure = json.load(f)
        
        shots = generate_shot_list(script_structure)
        
        # 创建输出目录
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(shots, f, ensure_ascii=False, indent=2)
        
        print(f"✓ Shot list generated successfully: {output_file}")
        print(f"  Total shots: {len(shots)}")
        
    except Exception as e:
        print(f"Error generating shot list: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()