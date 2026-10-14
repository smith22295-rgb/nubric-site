"""Check public site files without emitting credential values or visitor data."""
from pathlib import Path
from html.parser import HTMLParser
import base64, hashlib, json, re, subprocess, sys

ROOT=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[2]
class Page(HTMLParser):
    def __init__(self):
        super().__init__();self.meta=[];self.scripts=[];self.forms=[];self.fields=[];self.handlers=[];self.resources=[];self.current=None
    def handle_starttag(self,tag,attrs):
        attributes=dict(attrs)
        if tag=='meta':self.meta.append(attributes)
        if tag=='script':self.current={'src':attributes.get('src'),'type':attributes.get('type'),'body':''};self.scripts.append(self.current)
        if tag=='form':self.forms.append(attributes)
        if tag in ['input','textarea','select']:self.fields.append(attributes)
        for key,value in attrs:
            if key.startswith('on'):self.handlers.append(key)
            if key in ['src','href','action'] and value:self.resources.append(value)
    def handle_data(self,value):
        if self.current:self.current['body']+=value
    def handle_endtag(self,tag):
        if tag=='script':self.current=None

try:
    git_root=Path(subprocess.check_output(['git','-C',str(ROOT),'rev-parse','--show-toplevel'],text=True,stderr=subprocess.DEVNULL).strip()).resolve()
    assert git_root==ROOT
    files=subprocess.check_output(['git','-C',str(ROOT),'ls-files','--cached','--others','--exclude-standard'],text=True).splitlines()
except (subprocess.CalledProcessError,AssertionError):
    files=[p.relative_to(ROOT).as_posix() for p in ROOT.rglob('*') if p.is_file() and '.git' not in p.parts and '__pycache__' not in p.parts]
patterns={
    'private-key':r'-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----',
    'github-token':r'\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{60,})\b',
    'aws-access-key':r'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b',
    'openai-key':r'\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}\b',
    'stripe-secret':r'\b(?:sk|rk)_live_[A-Za-z0-9]{20,}\b',
    'password-assignment':r'(?i)\b(?:password|client_secret|api_secret|access_token|refresh_token)\s*[:=]\s*[\"\'][^\"\']{8,}[\"\']',
}
errors=[];pages=0;forms=0
def require(condition,message):
    if not condition:errors.append(message)
for relative in files:
    path=ROOT/relative
    require(path.resolve().is_relative_to(ROOT),'A file escapes the public site root.')
    require(path.name not in ['.env','id_rsa','id_ed25519'] and not (path.name.startswith('.env.') and path.name!='.env.example') and path.suffix.lower() not in ['.pem','.key','.p12','.pfx','.ncard','.zip','.docx','.xlsx'],relative+': private document/key/archive type must not be committed to this public site.')
    require(not any(part in ['Data','Backups','Exports','ClientDesk','OperationsDesk','CardStudio','client-data','.private','Clients'] for part in Path(relative).parts),relative+': private client workspace path.')
    if path.suffix.lower() not in ['.html','.js','.css','.md','.txt','.json','.xml','.yml','.yaml','.py','.cjs'] or path.stat().st_size>2_000_000:continue
    text=path.read_text(encoding='utf-8',errors='replace')
    for label,pattern in patterns.items():
        for match in re.finditer(pattern,text):errors.append(relative+':'+str(text[:match.start()].count('\n')+1)+': suspected '+label+' (value withheld).')
    if path.suffix!='.html' or relative.startswith('_ops/') or not re.search(r'<head\b',text,re.I):continue
    pages+=1;p=Page();p.feed(text)
    policies=[m.get('content','') for m in p.meta if m.get('http-equiv','').lower()=='content-security-policy']
    require(len(policies)==1,relative+': needs one browser content security policy.')
    if not policies:continue
    directives={segment.split()[0]:segment.split()[1:] for segment in policies[0].split(';') if segment.strip()}
    for key in ['default-src','object-src','base-uri','frame-src','worker-src']:
        require(directives.get(key)==["'none'"],relative+': '+key+' must be disabled.')
    require(directives.get('script-src-attr')==["'none'"],relative+': inline event handlers must be disabled.')
    require("'self'" in directives.get('script-src',[]) and not any(x in directives.get('script-src',[]) for x in ["'unsafe-inline'","'unsafe-eval'",'*','https:']),relative+': script policy allows broad or unsafe execution.')
    require(all(value in ["'self'",'https://www.googletagmanager.com'] or re.fullmatch(r"'sha256-[A-Za-z0-9+/]{43}='",value) for value in directives.get('script-src',[])),relative+': unapproved script source.')
    require(not p.handlers,relative+': inline event handler found.')
    require(any(m.get('name')=='referrer' and m.get('content')=='strict-origin-when-cross-origin' for m in p.meta),relative+': needs an explicit privacy-preserving referrer policy.')
    first_resource=re.search(r'<(?:script|link|style)\b',text,re.I)
    policy_position=text.find('http-equiv="Content-Security-Policy"')
    require(not first_resource or policy_position<first_resource.start(),relative+': policy appears after resource loading.')
    require(not any(url.startswith(('http:','javascript:','//')) for url in p.resources),relative+': insecure or executable resource/link URL.')
    for script in p.scripts:
        if script['src']:
            require(script['src'].startswith('/assets/') and not script['src'].startswith('//'),relative+': unexpected remote script tag.')
        else:
            require(script['type'] in ['application/ld+json','application/json'],relative+': executable inline script.')
            if script['body']:
                expected="'sha256-"+base64.b64encode(hashlib.sha256(script['body'].encode()).digest()).decode()+"'"
                require(expected in directives.get('script-src',[]),relative+': structured-data hash is stale.')
                try:json.loads(script['body'])
                except ValueError:errors.append(relative+': invalid structured data.')
    for form in p.forms:
        if not form.get('action'):continue # Local demos cannot submit under form-action none.
        forms+=1
        require(form.get('action')=='https://formsubmit.co/info@nubric.dev' and form.get('method','').upper()=='POST',relative+': inquiry must use the approved encrypted POST endpoint.')
        require(directives.get('form-action')==['https://formsubmit.co'],relative+': inquiry destination is not restricted.')
        require(any(f.get('name')=='_honey' for f in p.fields),relative+': spam honeypot missing.')
        require(not any(f.get('name')=='_captcha' and f.get('value')=='false' for f in p.fields),relative+': provider spam challenge was disabled.')
        require(all(f.get('value','').startswith('https://nubric.dev/') for f in p.fields if f.get('name') in ['_url','_next','source_page']),relative+': unsafe form return/source address.')
    if not any(form.get('action') for form in p.forms):require(directives.get('form-action')==["'none'"],relative+': pages without inquiries must not submit forms.')

require(pages>=32,'Expected studio, portfolio and retained app-support pages were not all checked.')
require(forms==2,'Expected two inquiry forms.')
if errors:
    print(json.dumps({'passed':False,'errors':errors},indent=2));sys.exit(1)
print(json.dumps({'passed':True,'publicFilesChecked':len(files),'protectedHtmlPages':pages,'encryptedInquiryForms':forms,'secretPatternMatches':0,'unsafeInlineScripts':0},indent=2))
