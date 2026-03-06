#!/usr/bin/env python3
"""
故事板生成主工作流脚本
协调整个故事板生成流程，确保所有输出都在正确的目录结构中
支持错误处理、进度跟踪和多种艺术风格
"""

import json
import sys
import os
from pathlib import Path
import subprocess
import time

def get_story_name_from_file(story_file: Path) -> str:
    """从故事文件名提取故事名称"""
    name = story_file.stem.replace(" ", "_").replace("-", "_")
    # 移除特殊字符
    import re
    name = re.sub(r'[^\w]', '_', name)
    return name[:50] if len(name) > 50 else name

def create_output_structure(base_output_dir: Path, story_name: str) -> dict:
    """创建标准的输出目录结构"""
    storyboard_dir = base_output_dir / "storyboard" / story_name
    storyboard_dir.mkdir(parents=True, exist_ok=True)
    
    characters_dir = storyboard_dir / "characters"
    characters_dir.mkdir(exist_ok=True)
    
    shots_dir = storyboard_dir / "shots"
    shots_dir.mkdir(exist_ok=True)
    
    return {
        "root": storyboard_dir,
        "characters": characters_dir,
        "shots": shots_dir
    }

def run_script(script_name: str, args: list, description: str):
    """运行指定的脚本并处理错误"""
    script_path = Path(__file__).parent / script_name
    cmd = ["python3", str(script_path)] + [str(arg) for arg in args]
    
    print(f"\n🎬 {description}...")
    start_time = time.time()
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode != 0:
            print(f"❌ Error in {description}:")
            print(f"Command: {' '.join(cmd)}")
            print(f"Error output:\n{result.stderr}")
            return False
        
        end_time = time.time()
        duration = end_time - start_time
        print(f"✅ {description} completed ({duration:.1f}s)")
        if result.stdout.strip():
            # 只显示重要的输出行
            lines = result.stdout.strip().split('\n')
            important_lines = [line for line in lines if any(keyword in line.lower() 
                                for keyword in ['generated', 'total', 'error', 'warning'])]
            if important_lines:
                for line in important_lines:
                    print(f"  {line}")
        
        return True
        
    except subprocess.TimeoutExpired:
        print(f"❌ {description} timed out (5 minutes)")
        return False
    except Exception as e:
        print(f"❌ Unexpected error in {description}: {e}")
        return False

def validate_input(story_file: Path):
    """验证输入文件"""
    if not story_file.exists():
        raise FileNotFoundError(f"Input story file {story_file} does not exist")
    
    if story_file.stat().st_size == 0:
        raise ValueError(f"Input story file {story_file} is empty")
    
    try:
        with open(story_file, 'r', encoding='utf-8') as f:
            content = f.read(1000)  # 只读前1000字符进行验证
        if not content.strip():
            raise ValueError(f"Input story file {story_file} contains only whitespace")
    except UnicodeDecodeError:
        raise ValueError(f"Input story file {story_file} is not valid UTF-8 text")

def main():
    if len(sys.argv) < 3:
        print("Usage: main_workflow.py <input_story_file> <base_output_directory> [style]")
        print("\nAvailable styles:")
        print("  cinematic    - Cinematic photography style (default)")
        print("  cartoon      - Animated cartoon style")
        print("  watercolor   - Artistic watercolor painting style") 
        print("  anime        - Japanese anime style")
        print("  comic        - Comic book style")
        print("  realistic    - Photorealistic style")
        print("\nExample:")
        print("  python3 scripts/main_workflow.py ./stories/my_story.txt ./output cinematic")
        sys.exit(1)
    
    input_story_file = Path(sys.argv[1])
    base_output_dir = Path(sys.argv[2])
    style = sys.argv[3] if len(sys.argv) > 3 else "cinematic"
    
    # 验证输入
    try:
        validate_input(input_story_file)
    except (FileNotFoundError, ValueError) as e:
        print(f"❌ Input validation error: {e}")
        sys.exit(1)
    
    # 获取故事名称
    story_name = get_story_name_from_file(input_story_file)
    print(f"📖 Processing story: '{story_name}'")
    print(f"🎨 Selected style: {style}")
    
    # 创建输出目录结构
    dirs = create_output_structure(base_output_dir, story_name)
    print(f"📁 Output directory: {dirs['root']}")
    
    # 步骤1: 生成剧本结构
    script_structure_file = dirs['root'] / "script_structure.json"
    if not run_script("generate_script_structure.py", 
                     [input_story_file, script_structure_file],
                     "Step 1: Script structure generation"):
        sys.exit(1)
    
    # 步骤2: 生成分镜脚本
    shot_list_file = dirs['root'] / "shot_list.json"
    if not run_script("create_shot_list.py",
                     [script_structure_file, shot_list_file],
                     "Step 2: Shot list generation"):
        sys.exit(1)
    
    # 步骤3: 生成角色设计
    if not run_script("design_characters.py",
                     [input_story_file, dirs['characters'], story_name],
                     "Step 3: Character design generation"):
        sys.exit(1)
    
    # 步骤4: 生成图像提示词
    image_prompts_file = dirs['shots'] / "image_prompts.json"
    if not run_script("generate_storyboard_images.py",
                     [shot_list_file, dirs['characters'], dirs['shots'], style],
                     "Step 4: Image prompt generation"):
        sys.exit(1)
    
    # 步骤5: 应用角色一致性控制
    consistent_prompts_file = dirs['shots'] / "consistent_image_prompts.json"
    if not run_script("ensure_character_consistency.py",
                     [dirs['characters'], image_prompts_file, consistent_prompts_file],
                     "Step 5: Character consistency control"):
        sys.exit(1)
    
    # 步骤6: 编译最终的故事板
    final_storyboard_file = dirs['root'] / "storyboard.md"
    if not run_script("compile_storyboard.py",
                     [story_name, shot_list_file, dirs['characters'], dirs['shots'], final_storyboard_file],
                     "Step 6: Final storyboard compilation"):
        sys.exit(1)
    
    print(f"\n🎉 Storyboard generation complete!")
    print(f"📊 Final output: {final_storyboard_file}")
    print(f"📂 All files organized in: {dirs['root']}")
    print(f"\nNext steps:")
    print(f"1. Review the storyboard.md file")
    print(f"2. Use the prompts in consistent_image_prompts.json to generate actual images")
    print(f"3. Place generated images in the shots/ directory with names like shot_001.png")

if __name__ == "__main__":
    main()