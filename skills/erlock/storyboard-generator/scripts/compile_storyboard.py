#!/usr/bin/env python3
"""
故事板编译脚本
将所有生成的组件编译成最终的Markdown格式故事板输出，包含完整的视觉和文本信息
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

def create_markdown_storyboard(story_title: str, shots_data: list, characters_dir: Path, images_dir: Path, output_file: Path):
    """
    创建Markdown格式的故事板
    
    Args:
        story_title: 故事标题
        shots_data: 镜头数据
        characters_dir: 角色设计目录
        images_dir: 图像目录  
        output_file: 输出Markdown文件路径
    """
    markdown_content = []
    
    # 标题和元数据
    markdown_content.append(f"# Storyboard: {story_title}\n")
    markdown_content.append(f"*Generated on: {output_file.parent.name}*")
    markdown_content.append(f"*Total shots: {len(shots_data)}*\n")
    
    # 角色设计部分
    characters = load_characters(characters_dir)
    if characters:
        markdown_content.append("## Character Designs\n")
        
        for char_data in characters:
            markdown_content.append(f"### {char_data['name']} ({char_data['role']})")
            markdown_content.append(f"- **Story**: {char_data.get('story_title', 'Unknown')}")
            
            # 外观特征
            appearance = char_data['appearance']
            if appearance.get('age_range'):
                markdown_content.append(f"- **Age Range**: {appearance['age_range']}")
            if appearance.get('height'):
                markdown_content.append(f"- **Height**: {appearance['height']}")
            if appearance.get('build'):
                markdown_content.append(f"- **Build**: {appearance['build']}")
            if appearance.get('hair'):
                markdown_content.append(f"- **Hair**: {appearance['hair']}")
            if appearance.get('eyes'):
                markdown_content.append(f"- **Eyes**: {appearance['eyes']}")
            if appearance.get('clothing'):
                markdown_content.append(f"- **Clothing**: {appearance['clothing']}")
            
            # 独特特征
            if appearance.get('distinctive_features'):
                features = ', '.join(appearance['distinctive_features'])
                markdown_content.append(f"- **Distinctive Features**: {features}")
            
            # 个性特征
            if char_data.get('personality_traits'):
                traits = ', '.join(char_data['personality_traits'])
                markdown_content.append(f"- **Personality Traits**: {traits}")
            
            # 一致性说明
            if char_data.get('visual_consistency_notes'):
                markdown_content.append(f"- **Consistency Notes**: {char_data['visual_consistency_notes']}")
            
            markdown_content.append("")
    
    # 镜头部分
    markdown_content.append("## Shot List\n")
    
    for shot in shots_data:
        markdown_content.append(f"### Shot {shot['shot_id']}: {shot['description']}")
        markdown_content.append(f"- **Scene**: {shot.get('scene', 'Unknown')}")
        markdown_content.append(f"- **Type**: {shot['shot_type'].replace('_', ' ').title()}")
        markdown_content.append(f"- **Duration**: {shot['duration']}")
        if shot.get('camera_movement'):
            markdown_content.append(f"- **Camera Movement**: {shot['camera_movement'].replace('_', ' ').title()}")
        
        # 如果有对应的图像，添加到Markdown中
        image_path = images_dir / f"shot_{shot['shot_id']}.png"
        if image_path.exists():
            # 使用相对路径
            relative_image_path = f"shots/shot_{shot['shot_id']}.png"
            markdown_content.append(f"\n![Shot {shot['shot_id']} - {shot['description']}](./{relative_image_path})\n")
        else:
            markdown_content.append("\n*[Image not available - use the provided prompt to generate]*\n")
            
            # 添加提示词（如果有）
            prompts_file = images_dir / "consistent_image_prompts.json"
            if prompts_file.exists():
                try:
                    with open(prompts_file, 'r', encoding='utf-8') as f:
                        prompts = json.load(f)
                    for prompt_data in prompts:
                        if prompt_data['shot_id'] == shot['shot_id']:
                            markdown_content.append(f"**Image Generation Prompt:**\n")
                            markdown_content.append(f"```\n{prompt_data['enhanced_prompt']}\n```")
                            break
                except:
                    pass
    
    # 写入文件
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(markdown_content))

def main():
    if len(sys.argv) != 6:
        print("Usage: compile_storyboard.py <story_title> <shots_file> <characters_dir> <images_dir> <output_md>")
        print("Example: compile_storyboard.py 'My Story' ./shot_list.json ./characters ./shots ./storyboard.md")
        sys.exit(1)
    
    story_title = sys.argv[1]
    shots_file = Path(sys.argv[2])
    characters_dir = Path(sys.argv[3])
    images_dir = Path(sys.argv[4])
    output_md = Path(sys.argv[5])
    
    # 验证输入文件
    if not shots_file.exists():
        print(f"Error: Shots file {shots_file} does not exist")
        sys.exit(1)
    
    if not characters_dir.exists():
        print(f"Warning: Characters directory {characters_dir} does not exist")
    
    try:
        # 加载镜头数据
        with open(shots_file, 'r', encoding='utf-8') as f:
            shots_data = json.load(f)
        
        # 创建输出目录
        output_md.parent.mkdir(parents=True, exist_ok=True)
        
        # 创建Markdown故事板
        create_markdown_storyboard(story_title, shots_data, characters_dir, images_dir, output_md)
        
        print(f"✓ Final storyboard compiled successfully: {output_md}")
        print(f"  Story title: {story_title}")
        print(f"  Total shots: {len(shots_data)}")
        
    except Exception as e:
        print(f"Error compiling storyboard: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()