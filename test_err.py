import urllib.request, json
try:
    req = urllib.request.Request(
        'http://localhost:8000/api/emails/generate',
        data=json.dumps({'lead_id': 2}).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    print(urllib.request.urlopen(req).read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code)
    print(e.read().decode('utf-8'))
