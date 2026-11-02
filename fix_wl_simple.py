with open(r'D:\Projects\GURU\app\src\pages\Wallets.tsx', 'r') as f:
    lines = f.read().splitlines()
lines[99] = '            </div>)}'
lines[100] = '          )}'
with open(r'D:\Projects\GURU\app\src\pages\Wallets.tsx', 'w') as f:
    f.write('\n'.join(lines))
print('wallets fixed')
