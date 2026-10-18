"""Prepare dependencies/data, then execute and record the training job."""
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'models/food101'


def status(state, **extra):
    path = OUTPUT / 'job_status.json'
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(dict(state=state, pid=os.getpid(),
        updated_at=datetime.now(timezone.utc).isoformat(), **extra), indent=2), encoding='utf-8')
    temporary.replace(path)


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    stages = {
        'dependencies': [sys.executable, '-m', 'pip', 'install', '-r', str(ROOT / 'requirements-food.txt')],
        'dataset': [sys.executable, '-u', str(ROOT / 'src/prepare_food.py')],
    }
    processes, logs = {}, []
    try:
        for name, command in stages.items():
            log = (OUTPUT / f'{name}.log').open('a', encoding='utf-8')
            logs.append(log)
            processes[name] = subprocess.Popen(command, stdout=log, stderr=subprocess.STDOUT, cwd=ROOT.parent)
        while any(process.poll() is None for process in processes.values()):
            status('preparing', children={name: dict(pid=p.pid, exit_code=p.poll()) for name, p in processes.items()})
            time.sleep(10)
        failures = {name: p.returncode for name, p in processes.items() if p.returncode != 0}
    finally:
        for log in logs:
            log.close()
    if failures:
        status('failed', detail=failures)
        return
    probe = subprocess.run([sys.executable, '-c',
        'import torch, torchvision; assert torch.cuda.is_available(); '
        'x=torch.ones(8, device="cuda"); print(torch.__version__, torch.cuda.get_device_name(0), (x*x).sum().item())'],
        capture_output=True, text=True)
    if probe.returncode:
        status('failed', detail=probe.stderr[-2000:])
        return
    command = [sys.executable, '-u', str(ROOT / 'src/train_food.py'), '--epochs', '3']
    if (OUTPUT / 'last.pt').exists():
        command.extend(['--resume', str(OUTPUT / 'last.pt')])
    with (OUTPUT / 'training.log').open('a', encoding='utf-8') as log:
        process = subprocess.Popen(command, stdout=log, stderr=subprocess.STDOUT, cwd=ROOT.parent)
        status('training', training_pid=process.pid, command=command)
        code = process.wait()
    status('completed' if code == 0 else 'failed', exit_code=code,
           log=str(OUTPUT / 'training.log'))


if __name__ == '__main__':
    main()
