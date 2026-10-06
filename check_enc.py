import os
import re

def check_dir(d):
    for root, _, files in os.walk(d):
        if any(skip in root for skip in ['node_modules', '.git', '__pycache__', '.dart_tool', 'build', 'dist']):
            continue
        for f in files:
            if f.endswith(('.ts', '.tsx', '.js', '.jsx', '.json', '.arb', '.dart', '.py', '.md')):
                path = os.path.join(root, f)
                try:
                    with open(path, 'rb') as file:
                        raw = file.read()
                    
                    try:
                        content = raw.decode('utf-8')
                        has_cyrillic = bool(re.search(r'[А-Яа-я]', content))
                        has_mojibake = '' in content or 'Р”' in content or 'Р' in content
                        if has_cyrillic or has_mojibake:
                            print(f'File: {path}')
                            # Find the first non-ascii chunk
                            match = re.search(r'[^\x00-\x7F]{2,}', content)
                            if match:
                                print(f'  Preview: {match.group(0)[:50]}')
                            else:
                                print('  Preview: (scattered)')
                    except UnicodeDecodeError:
                        print(f'File: {path} (NOT UTF-8)')
                except Exception:
                    pass
check_dir('.')
