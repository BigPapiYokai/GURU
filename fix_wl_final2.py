with open('D:\Projects\\GURU\\app\\src\\pages\\Wallets.tsx', 'r') as f:
    lines = f.read().splitlines()
# Line 101 (0-indexed 100) needs '}' before the existing ')' — insert after '</div>'
lines[100] = lines[100].replace('))', '})')
with open('D:\Projects\\GURU\\app\\src\\pages\\Wallets.tsx', 'w') as f:
    f.write('\n'.join(lines))
print('wl fixed')
