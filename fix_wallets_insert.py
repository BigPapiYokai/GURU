with open(r'D:\Projects\GURU\app\src\pages\Wallets.tsx', 'r') as f:
    lines = f.read().splitlines()
# Line 100 (index 99) is '            </div>)' - need to insert } for arrow after )
# Change line 99 from '</div>)' to '</div>)\n          }' (close JSX return + arrow)
# Then fix line 100 from '          ))' to '          )}' (close .map + JSX braces)
lines[99] = '            </div>)'
# Actually insert arrow } after JSX return
# Let's just replace from index 99 onward with correct sequence
lines[99] = '            </div>)'
lines.insert(100, '          }')
lines[101] = '          )}'
# After insertion, indexes shift. Let's just build the tail from line 99 exactly.
with open(r'D:\Projects\GURU\app\src\pages\Wallets.tsx', 'w') as f:
    f.write('\\n'.join(lines))
print('wallets fixed')
