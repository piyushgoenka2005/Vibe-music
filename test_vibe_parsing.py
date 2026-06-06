import re

# Test content from vibemusic.in
content = '''## Zoom SPH-2n Accessory Pack for H2n Handy Recorder
[Sale!
	AVUS- THUDSTORM 16″ CYMBAL
	₹9,675.00 Original price was: ₹9,675.00.₹9,175.00Current price is: ₹9,175.00.](https://vibemusic.in/product/avus-thudstorm-16%e2%80%b3-cymbal/)
'''

# Test: simpler regex pattern
product_pattern = r'## ([^\n]+)\n\[Sale!\n\t([^\n]+)\n\t₹([\d,]+)\.00.*?₹([\d,]+)\.00.*?Current price is:\s*₹([\d,]+)\.00\]\n\((https://vibemusic\.in/product/[^\)]+)\)'

matches = re.findall(product_pattern, content)
print(f'Found {len(matches)} matches')
for i, match in enumerate(matches[:3]):
    print(f'Match {i+1}: {match}')
    
# Test: line by line approach
lines = content.split('\n')
for i, line in enumerate(lines):
    if '##' in line and 'https://vibemusic.in/product/' in line:
        print(f'Line {i}: {line.strip()}')
