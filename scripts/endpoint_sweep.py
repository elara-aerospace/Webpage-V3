"""Audit static bundles and optionally GET their public page endpoints (no form submissions)."""
import argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import sys
from urllib.parse import quote, unquote, urljoin, urlsplit
from urllib.request import Request, urlopen
from urllib.error import HTTPError

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.refs, self.ids, self.images = [], [], []
        self.feed(text)
        self.refs += re.findall(r'url\([\s\'"]*([^\)\'"]+)', text)
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'): self.ids.append(a['id'])
        for key in ('href', 'src', 'poster', 'action'):
            if a.get(key): self.refs.append(a[key])
        if a.get('srcset'):
            self.refs += [part.strip().split()[0] for part in a['srcset'].split(',') if part.strip()]
        if tag == 'img': self.images.append(a)

def audit(root):
    pages = {p: Page(p.read_text()) for p in root.rglob('*.html')}
    failures, refs = [], 0
    if not pages: failures.append(f'{root}: no HTML pages found')
    for path, page in pages.items():
        for ident, count in Counter(page.ids).items():
            if count > 1: failures.append(f'{path}: duplicate id {ident}')
        for ref in page.refs:
            url = urlsplit(ref)
            if url.scheme or url.netloc: continue
            refs += 1
            target = (root / unquote(url.path).lstrip('/') if url.path.startswith('/') else path.parent / unquote(url.path)) if url.path else path
            target = target.resolve()
            if target.is_dir(): target /= 'index.html'
            if not target.is_file(): failures.append(f'{path.relative_to(root)}: missing {ref}')
            elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
                failures.append(f'{path.relative_to(root)}: missing fragment {ref}')
    for path in root.rglob('*.css'):
        for ref in re.findall(r'url\([\s\'"]*([^\)\'"]+)', path.read_text()):
            url = urlsplit(ref)
            if url.scheme or url.netloc or not url.path: continue
            target = root / unquote(url.path).lstrip('/') if url.path.startswith('/') else path.parent / unquote(url.path)
            refs += 1
            if not target.is_file(): failures.append(f'{path.relative_to(root)}: missing CSS asset {ref}')
    return {'root': str(root), 'pages': len(pages), 'local_references': refs, 'failures': sorted(set(failures))}

def get(url):
    try:
        with urlopen(Request(url, headers={'User-Agent': 'ElaraEndpointAudit/1.0'}), timeout=20) as response:
            while response.read(65536):
                pass
            return {'url': url, 'status': response.status, 'final_url': response.url,
                    'content_type': response.headers.get('Content-Type'),
                    'cache_control': response.headers.get('Cache-Control'),
                    'content_encoding': response.headers.get('Content-Encoding')}
    except HTTPError as error: return {'url': url, 'status': error.code}
    except Exception as error: return {'url': url, 'error': str(error)}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('roots', nargs='*', default=['dist', 'competition-dist'])
    parser.add_argument('--local-http', action='store_true', help='Serve each bundle on loopback and GET every file')
    parser.add_argument('--base-url', help='GET all HTML routes in the first root at this origin')
    args = parser.parse_args()
    results = [audit(Path(root).resolve()) for root in args.roots]
    output = {'bundles': results}
    if args.local_http:
        from functools import partial
        from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
        from threading import Thread
        class Quiet(SimpleHTTPRequestHandler):
            def log_message(self, *args): pass
        output['http'] = []
        for directory in args.roots:
            server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=directory))
            Thread(target=server.serve_forever, daemon=True).start()
            try:
                urls = [f'http://127.0.0.1:{server.server_port}/' + quote(p.relative_to(directory).as_posix())
                        for p in Path(directory).rglob('*') if p.is_file()]
                with ThreadPoolExecutor(max_workers=6) as pool:
                    output['http'].extend(pool.map(get, urls))
            finally:
                server.shutdown()
                server.server_close()
    if args.base_url:
        root = Path(args.roots[0])
        paths = [p.relative_to(root).as_posix() for p in root.rglob('*.html')]
        paths += [''] + [name for name in ['robots.txt', 'sitemap.xml', 'styles.min.css', 'app.min.js'] if (root / name).is_file()]
        with ThreadPoolExecutor(max_workers=6) as pool:
            output['http'] = list(pool.map(get, [urljoin(args.base_url.rstrip('/') + '/', p) for p in paths]))
    print(json.dumps(output, indent=2))
    sys.exit(bool(any(r['failures'] for r in results) or any(r.get('error') or r.get('status', 0) >= 400 for r in output.get('http', []))))
