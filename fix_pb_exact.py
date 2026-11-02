with open('D:\\Projects\\GURU\\app\\src\\pages\\PumpFunBullish.tsx', 'r') as f:
    lines = f.read().splitlines()
# Fix line 106 (0-indexed 105): add arrow } before .map )
lines[105] = '            )}'
# Line 107 (0-indexed 106): .map close should be ) not ))
lines[106] = '          )}'
with open('D:\\Projects\\GURU\\app\\src\\pages\\PumpFunBullish.tsx', 'w') as f:
    f.write('\n'.join(lines))
print('pb fixed')
