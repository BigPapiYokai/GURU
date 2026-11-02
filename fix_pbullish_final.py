with open(r'D:\Projects\GURU\app\src\pages\PumpFunBullish.tsx', 'r') as f:
    lines = f.read().splitlines(True)
# Replace lines 104-111 (0-indexed: 103-110)
lines[103] = '              </div>\n'
lines[104] = '            )}\n'
lines[105] = '          ))}\n'
lines[106] = '        </div>\n'
lines[107] = '      </div>\n'
lines[108] = '    </div>\n'
lines[109] = '  )\n'
lines[110] = '}\n'
with open(r'D:\Projects\GURU\app\src\pages\PumpFunBullish.tsx', 'w') as f:
    f.writelines(lines)
print('fixed pbullish')
