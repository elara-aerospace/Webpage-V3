"""Scan public bundles for secret formats, private files and image metadata.
Never print credential values. Public HubSpot portal/form IDs are not secrets.
"""
from pathlib import Path
from PIL import Image
import json,re,sys
rules={
'private_key':r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
'aws_access_key':r'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b',
'github_token':r'\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b',
'openai_key':r'\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}',
'hubspot_private_token':r'\bpat-(?:eu1|na1|na2|ap1)-[A-Za-z0-9-]{25,}',
'secret_assignment':r'(?i)["\']?(?:api[_-]?key|client[_-]?secret|password|secret[_-]?key|access[_-]?token)["\']?\s*[:=]\s*["\'][^"\'\s]{12,}["\']',
}
failures=[];count=0
for root in [Path('dist'),Path('competition-dist')]:
 for p in root.rglob('*'):
  if not p.is_file():continue
  count+=1; rel=p.relative_to(root)
  if any(part.startswith('.') for part in rel.parts) or p.suffix.lower() in {'.env','.pem','.key','.arw','.heic','.map','.py','.cjs'}:failures.append({'file':str(p),'rule':'private_or_source_file'})
  if p.suffix.lower() in {'.html','.js','.css','.json','.txt','.md','.xml','.svg'}:
   text=p.read_text(errors='replace')
   for name,pattern in rules.items():
    for m in re.finditer(pattern,text):failures.append({'file':str(p),'line':text[:m.start()].count('\n')+1,'rule':name})
  if p.suffix.lower() in {'.jpg','.jpeg','.png','.webp'}:
   with Image.open(p) as image:
    exif=image.getexif()
    if 34853 in exif:failures.append({'file':str(p),'rule':'gps_metadata'})
report={'files_scanned':count,'failures':failures,'scope':'Public static bundles only. Provider credentials and server configuration are outside this repository.'}
Path('deployment/security-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2));sys.exit(bool(failures))
