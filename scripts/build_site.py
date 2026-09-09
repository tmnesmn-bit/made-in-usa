import json,html
d=json.load(open(__import__('pathlib').Path(__file__).resolve().parent.parent/'data'/'index.json'))
s=json.dumps(d,separators=(',',':')).replace('</','<\\/')
body=open(__import__('pathlib').Path(__file__).resolve().parent.parent/'site'/'template.html').read().replace('__DATA__',s)
open(__import__('pathlib').Path(__file__).resolve().parent.parent/'site'/'artifact.html','w').write(body)
# standalone for own domain
ld={"@context":"https://schema.org","@type":"ItemList","name":"Made in USA Index","description":"A hand-kept list of products made in the United States, with union shops marked and sources on every entry.","numberOfItems":len(d['items']),
 "itemListElement":[{"@type":"ListItem","position":i+1,"name":e['name'],**({"url":e['buy_url']} if e.get('buy_url') else {})} for i,e in enumerate(sorted(d['items'],key=lambda e:e['name'].lower()))]}
head='''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="A hand-kept list of products still made in the United States, and who makes them. Union shops are marked. Tools, boots, tires, trucks, beer, appliances, hotels and more, with a source on every entry.">
<meta name="robots" content="index,follow">
<meta property="og:title" content="Made in USA Index">
<meta property="og:description" content="What is still made in this country, who makes it, and whether the shop is union. Sources on every entry.">
<meta property="og:type" content="website">
<link rel="canonical" href="https://YOURDOMAIN.example/">
<script type="application/ld+json">'''+json.dumps(ld,separators=(',',':')).replace('</','<\\/')+'''</script>
<style>img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
'''
open(__import__('pathlib').Path(__file__).resolve().parent.parent/'site'/'index.html','w').write(head+body+'\n</body>\n</html>\n')
# keep the copies the extension and the site serve in sync with data/index.json
root=__import__('pathlib').Path(__file__).resolve().parent.parent
raw=(root/'data'/'index.json').read_text(encoding='utf-8')
(root/'site'/'index.json').write_text(raw,encoding='utf-8')
(root/'extension'/'data'/'index.json').write_text(raw,encoding='utf-8')
print(len(body)//1024,'KB artifact;',len(head+body)//1024,'KB standalone; index.json synced to site/ and extension/data/')
