import os
for root, dirs, files in os.walk(r'D:\Projects\GURU\app\dist\assets'):
    for f in files:
        if f.endswith('.js'):
            path = os.path.join(root, f)
            with open(path, 'rb') as file:
                content = file.read()
                if b'1207765792848109568' in content:
                    print('Found in', path)
