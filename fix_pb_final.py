with open('D:\\Projects\\GURU\\app\\src\\pages\\PumpFunBullish.tsx', 'r') as f:
    lines = f.read().splitlines()
lines[108] = lines[108].rstrip() + ')'
lines[109] = lines[109].rstrip() + '}'
with open('D:\\Projects\\GURU\\app\\src\\pages\\PumpFunBullish.tsx', 'w') as f:
    f.write('\n'.join(lines))
print('pb fixed')
