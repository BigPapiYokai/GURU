with open(r'D:\Projects\GURU\app\src\pages\Wallets.tsx', 'r') as f:
    content = f.read()
# Find the broken tail and replace with correct closing sequence
marker = '              </div>\n            </div>)}\n          )}\n        }'
replacement = '              </div>\n            </div>\n          ))\n        }\n        </div>\n      </div>\n    </div>\n  )\n}'
content = content.replace(marker, replacement)
with open(r'D:\Projects\GURU\app\src\pages\Wallets.tsx', 'w') as f:
    f.write(content)
print('done')
