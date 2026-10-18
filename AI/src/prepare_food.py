"""Download the official Food-101 archive with progress, verify and safely extract."""
import hashlib
import tarfile
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'dataset/food101'
URL = 'https://data.vision.ee.ethz.ch/cvl/food-101.tar.gz'
MD5 = '85eeb15f3717b99a5da872d97d918f87'


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    if (ROOT / 'READY').exists() and (ROOT / 'food-101/meta/train.json').exists():
        print('Food-101 already prepared.', flush=True)
        return
    archive = ROOT / 'food-101.tar.gz'
    if not archive.exists():
        partial = ROOT / 'food-101.tar.gz.partial'
        offset = partial.stat().st_size if partial.exists() else 0
        request = urllib.request.Request(URL, headers={'Range': f'bytes={offset}-'} if offset else {})
        with urllib.request.urlopen(request, timeout=120) as response:
            if offset and response.status == 206:
                content_range = response.headers.get('Content-Range', '')
                if not content_range.startswith(f'bytes {offset}-'):
                    raise ValueError(f'Unexpected Content-Range: {content_range}')
            else:
                offset = 0
            total = offset + int(response.headers.get('Content-Length', 0))
            done, last = offset, time.monotonic()
            print(f'Download starting at {done / 1e9:.2f}/{total / 1e9:.2f} GB', flush=True)
            with partial.open('ab' if offset else 'wb') as target:
                while chunk := response.read(4 * 1024 * 1024):
                    target.write(chunk)
                    done += len(chunk)
                    if time.monotonic() - last > 15:
                        print(f'Download: {done / 1e9:.2f}/{total / 1e9:.2f} GB', flush=True)
                        last = time.monotonic()
        partial.replace(archive)
    with archive.open('rb') as source:
        digest = hashlib.file_digest(source, 'md5').hexdigest()
    if digest != MD5:
        raise ValueError(f'Food-101 archive checksum mismatch: {digest}')
    print('Checksum verified. Extracting Food-101...', flush=True)
    with tarfile.open(archive) as source:
        source.extractall(ROOT, filter='data')
    (ROOT / 'READY').write_text(digest, encoding='ascii')
    print('Food-101 ready.', flush=True)


if __name__ == '__main__':
    main()
