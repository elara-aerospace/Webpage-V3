"""Create smaller WebP derivatives for referenced images; retain original files."""
from pathlib import Path
from PIL import Image, ImageOps
import hashlib, io, json, re
ROOT = Path(__file__).resolve().parents[1]
texts = list(ROOT.glob('*.html')) + list((ROOT/'news').glob('*.html')) + [ROOT/n for n in ['styles.css','app.js','homepage-data.js','llms.txt','llms-full.md']]
contents = {p:p.read_text() for p in texts}
combined = '\n'.join(contents.values())
output = ROOT/'assets/optimized/site'
output.mkdir(parents=True, exist_ok=True)
report=ROOT/'deployment/image-optimization.json'
previous=json.loads(report.read_text()) if report.exists() else []
changes=[]
for source in sorted((ROOT/'assets').rglob('*')):
    if not source.is_file() or source.suffix.lower() not in {'.jpg','.jpeg','.png','.webp'}: continue
    relative=source.relative_to(ROOT).as_posix()
    if '/optimized/' in relative or relative not in combined: continue
    with Image.open(source) as original:
        if getattr(original,'is_animated',False): continue
        image=ImageOps.exif_transpose(original)
        # Existing explicit responsive variants must keep their advertised dimensions.
        in_srcset=any(relative in match for match in re.findall(r'srcset="[^"]+"',combined))
        needs_name=bool(re.search(r'(?i)(IMG_|DSC|Screenshot|CustomizedView|[0-9a-f]{8}-[0-9a-f]{4}|\s)',source.name))
        if not needs_name and source.suffix.lower()=='.webp' and source.stat().st_size < 200_000 and max(image.size)<=1920: continue
        if not in_srcset: image.thumbnail((1920,1920),Image.Resampling.LANCZOS)
        image=image.convert('RGBA' if 'A' in image.getbands() or 'transparency' in image.info else 'RGB')
        buffer=io.BytesIO(); image.save(buffer,'WEBP',quality=85,method=6)
        data=buffer.getvalue()
        extension='.webp'
        if len(data)>=source.stat().st_size*.95:
            if not needs_name: continue
            data=source.read_bytes(); extension=source.suffix.lower()
        # Use accessible image description where available instead of camera/CAD names.
        tag=next((t for t in re.findall(r'<img\b[^>]+>',combined) if relative in t), '')
        alt=re.search(r'alt="([^"]+)"',tag)
        label=alt.group(1) if alt and alt.group(1) else source.stem
        slug=re.sub(r'[^a-z0-9]+','-',label.lower()).strip('-')[:85].rstrip('-')
        name=f'{slug}-{hashlib.sha256(relative.encode()).hexdigest()[:8]}{extension}'
        target=output/name; target.write_bytes(data)
        new=target.relative_to(ROOT).as_posix()
        for p in contents: contents[p]=contents[p].replace(relative,new)
        changes.append({'source':relative,'optimized':new,'before_bytes':source.stat().st_size,'after_bytes':len(data),'width':image.width,'height':image.height})
for p,s in contents.items():
    if s!=p.read_text(): p.write_text(s)
report.write_text(json.dumps(previous+changes,indent=2)+'\n')
print(f'Optimized {len(changes)} images; saved {sum(c["before_bytes"]-c["after_bytes"] for c in changes)/1024/1024:.2f} MiB in referenced media.')
