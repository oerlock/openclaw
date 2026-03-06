#!/usr/bin/env python3
"""
角色一致性控制脚本
确保所有生成的画面中角色外观保持一致，提供详细的视觉指南
"""

import json
import sys
from pathlib import Path

def load_characters(characters_dir: Path) -> list:
    """加载所有角色设计"""
    characters = []
    for char_file in sorted(characters_dir.glob("*.json")):
        with open(char_file, 'r', encoding='utf-8') as f:
            char_data = json.load(f)
            characters.append(char_data)
    return characters

def create_character_consistency_guide(characters: list) -> dict:
    """
    基于角色设计创建一致性指南
    
    Args:
        characters: 角色设计列表
        
    Returns:
        一致性指南字典
    """
    consistency_guide = {}
    
    for char in characters:
        char_name = char["name"]
        appearance = char["appearance"]
        
        # 创建详细的视觉特征描述
        visual_features = {
            "core_identity": {
                "name": char_name,
                "role": char["role"],
                "story_title": char.get("story_title", "Unknown")
            },
            "physical_features": {
                "age_range": appearance.get("age_range", "unknown"),
                "height": appearance.get("height", "unknown"),
                "build": appearance.get("build", "unknown"),
                "hair": appearance.get("hair", "unknown"),
                "eyes": appearance.get("eyes", "unknown")
            },
            "key_visual_elements": {
                "clothing": appearance.get("clothing", "standard attire"),
                "distinctive_features": appearance.get("distinctive_features", []),
                "posture": appearance.get("posture", "natural stance")
            },
            "consistency_rules": [
                f"Always maintain {char_name}'s distinctive features in every shot",
                f"Keep clothing style consistent with character role and story context",
                f"Preserve hair color and style across all scenes",
                f"Maintain consistent eye color and expression style"
            ],
            "reference_notes": char.get("visual_consistency_notes", f"Consistency is crucial for {char_name}")
        }
        
        consistency_guide[char_name] = visual_features
    
    return consistency_guide

def enhance_prompt_with_consistency(original_prompt: str, char_name: str, guide: dict) -> str:
    """使用一致性指南增强提示词"""
    enhanced_parts = [original_prompt]
    
    # 添加核心物理特征
    physical = guide["physical_features"]
    physical_features = []
    if physical["hair"] != "unknown":
        physical_features.append(f"{physical['hair']} hair")
    if physical["eyes"] != "unknown":
        physical_features.append(f"{physical['eyes']} eyes")
    
    if physical_features:
        enhanced_parts.append(f"with {' and '.join(physical_features)}")
    
    # 添加关键视觉元素
    key_elements = guide["key_visual_elements"]
    if key_elements["clothing"] != "standard attire":
        enhanced_parts.append(f"wearing {key_elements['clothing']}")
    
    if key_elements["distinctive_features"]:
        features = ", ".join(key_elements["distinctive_features"])
        enhanced_parts.append(f"featuring {features}")
    
    # 添加一致性规则作为负面提示的指导
    enhanced_parts.append("consistent character design, no visual inconsistencies")
    
    return ", ".join(enhanced_parts)

def apply_consistency_to_prompts(image_prompts: list, consistency_guide: dict) -> list:
    """
    将一致性指南应用到图像提示词中
    
    Args:
        image_prompts: 原始图像提示词列表
        consistency_guide: 一致性指南
        
    Returns:
        更新后的图像提示词列表
    """
    updated_prompts = []
    
    for prompt_data in image_prompts:
        original_prompt = prompt_data["prompt"]
        shot_id = prompt_data["shot_id"]
        shot_description = prompt_data["shot_description"]
        
        # 检查提示词中是否包含角色名称
        enhanced_prompt = original_prompt
        applied_characters = []
        
        for char_name, guide in consistency_guide.items():
            if char_name in shot_description or char_name in original_prompt:
                enhanced_prompt = enhance_prompt_with_consistency(original_prompt, char_name, guide)
                applied_characters.append(char_name)
        
        updated_prompts.append({
            "shot_id": shot_id,
            "shot_description": shot_description,
            "original_prompt": original_prompt,
            "enhanced_prompt": enhanced_prompt,
            "applied_characters": applied_characters,
            "output_file": prompt_data["output_file"],
            "style": prompt_data["style"]
        })
    
    return updated_prompts

def generate_consistency_report(consistency_guide: dict, updated_prompts: list) -> dict:
    """生成一致性控制报告"""
    report = {
        "total_characters": len(consistency_guide),
        "total_shots": len(updated_prompts),
        "character_coverage": {},
        "consistency_rules_applied": []
    }
    
    # 统计每个角色在多少个镜头中出现
    char_counts = {char: 0 for char in consistency_guide.keys()}
    for prompt in updated_prompts:
        for char in prompt["applied_characters"]:
            if char in char_counts:
                char_counts[char] += 1
    
    report["character_coverage"] = char_counts
    
    # 收集所有应用的一致性规则
    all_rules = set()
    for guide in consistency_guide.values():
        all_rules.update(guide["consistency_rules"])
    report["consistency_rules_applied"] = list(all_rules)
    
    return report

def main():
    if len(sys.argv) != 4:
        print("Usage: ensure_character_consistency.py <characters_dir> <image_prompts_file> <output_consistent_prompts_file>")
        print("Example: ensure_character_consistency.py ./characters ./shots/image_prompts.json ./shots/consistent_image_prompts.json")
        sys.exit(1)
    
    characters_dir = Path(sys.argv[1])
    prompts_file = Path(sys.argv[2])
    output_file = Path(sys.argv[3])
    
    if not characters_dir.exists():
        print(f"Error: Characters directory {characters_dir} does not exist")
        sys.exit(1)
    
    if not prompts_file.exists():
        print(f"Error: Prompts file {prompts_file} does not exist")
        sys.exit(1)
    
    try:
        # 加载角色设计
        characters = load_characters(characters_dir)
        
        if not characters:
            print("Warning: No character designs found, skipping consistency control")
            # 复制原始文件
            import shutil
            shutil.copy2(prompts_file, output_file)
            print(f"Original prompts copied to: {output_file}")
            return
        
        # 创建一致性指南
        consistency_guide = create_character_consistency_guide(characters)
        
        # 加载原始提示词
        with open(prompts_file, 'r', encoding='utf-8') as f:
            image_prompts = json.load(f)
        
        # 应用一致性
        consistent_prompts = apply_consistency_to_prompts(image_prompts, consistency_guide)
        
        # 生成报告
        report = generate_consistency_report(consistency_guide, consistent_prompts)
        
        # 保存结果
        output_file.parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(consistent_prompts, f, ensure_ascii=False, indent=2)
        
        # 保存报告
        report_file = output_file.parent / "consistency_report.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        print(f"✓ Character consistency applied successfully: {output_file}")
        print(f"  Characters processed: {report['total_characters']}")
        print(f"  Shots enhanced: {report['total_shots']}")
        print(f"  Consistency report: {report_file}")
        
    except Exception as e:
        print(f"Error applying character consistency: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()