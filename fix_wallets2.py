with open(r'D:\Projects\GURU\app\src\pages\Wallets.tsx', 'r') as f:
    c = f.read()
c = c.replace('          ))\n        }\n        </div>', '          )\n        }\n        </div>')
with open(r'D:\Projects\GURU\app\src\pages\Wallets.tsx', 'w') as f:
    f.write(c)
print('wallets fixed')
