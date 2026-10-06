"""Verify the actual Pages URL from the deployment runner; never loads private data."""
import json,os,time,urllib.request,urllib.error
base=os.environ['PAGES_URL'].rstrip('/')+'/'
if not base.startswith('https://'):raise RuntimeError('Deployment URL must use HTTPS')
def read(path):
    request=urllib.request.Request(base+path,headers={'Cache-Control':'no-cache'})
    with urllib.request.urlopen(request,timeout=15) as response:
        assert response.status==200
        return response.read().decode('utf8')
last=None
for attempt in range(8):
    try:
        html=read('');assert 'LF Interactive file map' in html and './app.mjs' in html
        assert 'ActivityStore' in read('app.mjs')
        assert 'normalizeGraph' in read('model.mjs')
        data=json.loads(read('data/graph.json'));assert data['nodes']==[] and data['edges']==[]
        config=json.loads(read('config.json'));assert config['eventServiceUrl']==''
        for path in ['data-private/graph.json','private-data/graph.json']:
            try:read(path)
            except urllib.error.HTTPError as error:assert error.code==404
            else:raise RuntimeError('Private inventory route is publicly accessible')
        print(json.dumps({'url':base,'http':'PASS','frontend_assets':'PASS','public_inventory':'EMPTY','private_routes':'404','deployment_verified':True}))
        break
    except Exception as error:
        last=error
        if attempt==7:raise
        time.sleep(5)
