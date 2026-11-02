with open(r'D:\Projects\GURU\app\dist\assets\index-DDvuQ0zW.js', 'rb') as f:
    content = f.read()
print('Embedded' if b'1207765792848109568-yTyxwbA4yL9dhsHFh8SOzqUTEmAFRJ' in content else 'NOT embedded')
