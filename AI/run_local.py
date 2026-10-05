"""Run with dependencies installed via pip --target .venv/Lib/site-packages.

Fallback for this machine's embedded Python; normal Python users can use venv.
Usage: python run_local.py src/train.py [arguments]
"""
import runpy
import sys
from pathlib import Path

root = Path(__file__).resolve().parent
sys.path.insert(0, str(root / '.venv/Lib/site-packages'))
sys.path.insert(0, str(root))
if len(sys.argv) < 2:
    raise SystemExit('Usage: python run_local.py src/train.py [arguments]')
script = (root / sys.argv[1]).resolve()
if not script.is_relative_to(root) or script.suffix != '.py':
    raise SystemExit('Script must be a Python file inside AI/')
sys.path.insert(0, str(script.parent))
sys.argv = [str(script), *sys.argv[2:]]
runpy.run_path(str(script), run_name='__main__')
