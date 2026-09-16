import sys

def patch_file(filepath, start_marker, end_marker, replacement_file):
    with open(filepath, 'r') as f:
        lines = f.readlines()
        
    with open(replacement_file, 'r') as f:
        replacement = f.read()
        
    start_idx = -1
    end_idx = -1
    
    for i, line in enumerate(lines):
        if start_marker in line:
            start_idx = i
            break
            
    if start_idx != -1:
        for i in range(start_idx, len(lines)):
            if end_marker in lines[i]:
                end_idx = i
                break
                
    if start_idx != -1 and end_idx != -1:
        new_lines = lines[:start_idx] + [replacement + "\n"] + lines[end_idx:]
        with open(filepath, 'w') as f:
            f.writelines(new_lines)
        print("Patched successfully")
    else:
        print("Markers not found", start_idx, end_idx)

if __name__ == '__main__':
    patch_file('src/App.tsx', sys.argv[1], sys.argv[2], sys.argv[3])
