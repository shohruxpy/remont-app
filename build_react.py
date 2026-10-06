import re
import os
import json

with open('extracted_web_html.txt', 'r', encoding='utf-8') as f:
    html = f.read()

pages = {
    'w1': 'Dashboard',
    'w2': 'Machines',
    'w3': 'Repairs',
    'w4': 'Plans',
    'w5': 'Templates',
    'w6': 'Users',
    'w7': 'Audit',
    'w8': 'Reports'
}

from bs4 import BeautifulSoup, NavigableString

soup = BeautifulSoup(html, 'html.parser')

os.makedirs('web/src/pages', exist_ok=True)
translations = {}
text_counter = 1

def reactify_style(style_str):
    if not style_str: return "{}"
    styles = []
    for part in style_str.split(';'):
        if ':' in part:
            k, v = part.split(':', 1)
            k = k.strip()
            v = v.strip()
            k = re.sub(r'-([a-z])', lambda m: m.group(1).upper(), k)
            styles.append(f"'{k}': '{v}'")
    return "{{ " + ", ".join(styles) + " }}"

def process_node(node):
    global text_counter
    if isinstance(node, NavigableString):
        text = str(node).strip()
        if text:
            key = f"t_{text_counter}"
            text_counter += 1
            translations[key] = text
            # escape braces
            text_jsx = f"{{t('{key}')}}"
            return text_jsx
        return " "
    
    tag = node.name
    attrs = []
    self_closing = ['input', 'img', 'br', 'hr', 'use']
    
    for k, v in node.attrs.items():
        if k == 'class':
            cls = " ".join(v) if isinstance(v, list) else v
            attrs.append(f'className="{cls}"')
        elif k == 'style':
            attrs.append(f'style={reactify_style(v)}')
        elif k == 'for':
            attrs.append(f'htmlFor="{v}"')
        elif k in ('id', 'data-t', 'data-go', 'colspan'):
            if k == 'colspan': attrs.append(f'colSpan="{v}"')
        else:
            val = " ".join(v) if isinstance(v, list) else str(v)
            attrs.append(f'{k}="{val}"')
            
    attr_str = " ".join(attrs)
    if attr_str: attr_str = " " + attr_str
    
    children = "".join([process_node(c) for c in node.children])
    
    if tag in self_closing:
        return f"<{tag}{attr_str} />"
    else:
        return f"<{tag}{attr_str}>{children}</{tag}>"

for w_id, comp_name in pages.items():
    pg = soup.find('div', id=w_id)
    if not pg: continue
    
    inner_jsx = "".join([process_node(c) for c in pg.children])
    
    jsx = f"""import React from 'react';
import {{ useTranslation }} from 'react-i18next';

export default function {comp_name}() {{
  const {{ t }} = useTranslation();
  return (
    <div className="pg-content">
      {inner_jsx}
    </div>
  );
}}
"""
    with open(f"web/src/pages/{comp_name}.tsx", "w", encoding="utf-8") as out:
        out.write(jsx)

with open("web/src/locales_ru.json", "w", encoding="utf-8") as f:
    json.dump(translations, f, ensure_ascii=False, indent=2)

print("Generated pages and locales.")
