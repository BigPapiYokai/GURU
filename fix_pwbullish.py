with open(r'D:\Projects\GURU\app\src\pages\PumpFunBullish.tsx', 'r') as f:
    c = f.read()
c = c.replace('''          }))
        </div>''', '''          }))}
        </div>''')
with open(r'D:\Projects\GURU\app\src\pages\PumpFunBullish.tsx', 'w') as f:
    f.write(c)
print('done')
