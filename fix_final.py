with open(r'D:\Projects\GURU\app\src\pages\PumpFunBullish.tsx', 'r') as f:
    c = f.read()
old = '              </div>\n            )\n          ))\n        </div>\n      </div>\n    </div>\n  )\n}'
new = '              </div>\n            )}\n          ))}\n        </div>\n      </div>\n    </div>\n  )\n}'
c = c.replace(old, new)
with open(r'D:\Projects\GURU\app\src\pages\PumpFunBullish.tsx', 'w') as f:
    f.write(c)
print('pb done')
with open(r'D:\Projects\GURU\app\src\pages\Wallets.tsx', 'r') as f:
    c = f.read()
old = '          ))\n        }\n        </div>'
new = '          )\n        }\n        </div>'
c = c.replace(old, new)
with open(r'D:\Projects\GURU\app\src\pages\Wallets.tsx', 'w') as f:
    f.write(c)
print('wl done')
