with open('D:\\Projects\\GURU\\app\\src\\pages\\Wallets.tsx', 'r') as f:
    lines = f.read().splitlines()
# Find the .map() closing line (line 101 = index 100) and replace )) with })
for i in range(len(lines)):
    if lines[i].strip() == '))':
        lines[i] = lines[i].replace('))', '})')
        break
with open('D:\\Projects\\GURU\\app\\src\\pages\\Wallets.tsx', 'w') as f:
    f.write('\n'.join(lines))
print('wl fixed')
