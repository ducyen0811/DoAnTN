"""Fine-tune EfficientNet-B0 on Food-101 with a separate validation split."""
import argparse
import json
import random
import time
from pathlib import Path

import torch
from torch import nn
from torch.utils.data import DataLoader, Subset
from torchvision import datasets, models, transforms

ROOT = Path(__file__).resolve().parents[1]


def save_json(path, value):
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(value, indent=2), encoding='utf-8')
    temporary.replace(path)


def run_epoch(model, loader, device, optimizer=None, scaler=None):
    model.train(optimizer is not None)
    total = correct = top5 = 0
    loss_sum = 0.0
    with torch.set_grad_enabled(optimizer is not None):
        for step, (images, labels) in enumerate(loader):
            images, labels = images.to(device), labels.to(device)
            if optimizer:
                optimizer.zero_grad(set_to_none=True)
            with torch.autocast(device_type=device.type, enabled=device.type == 'cuda'):
                logits = model(images)
                loss = nn.functional.cross_entropy(logits, labels)
            if optimizer:
                scaler.scale(loss).backward()
                scaler.step(optimizer)
                scaler.update()
            total += labels.size(0)
            loss_sum += loss.item() * labels.size(0)
            correct += (logits.argmax(1) == labels).sum().item()
            top5 += (logits.topk(5, dim=1).indices == labels[:, None]).any(1).sum().item()
            if step % 100 == 0:
                print(f'  batch {step}/{len(loader)} loss={loss.item():.4f}', flush=True)
    return dict(rows=total, loss=loss_sum / total, accuracy=correct / total, top5=top5 / total)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--epochs', type=int, default=3)
    parser.add_argument('--batch-size', type=int, default=32)
    parser.add_argument('--workers', type=int, default=2)
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--resume', type=Path)
    parser.add_argument('--prepare-only', action='store_true')
    args = parser.parse_args()
    if args.epochs < 1 or args.batch_size < 1:
        parser.error('epochs and batch-size must be positive')
    random.seed(args.seed)
    torch.manual_seed(args.seed)
    torch.set_num_threads(4)
    torch.hub.set_dir(str(ROOT / '.torch-cache'))
    output = ROOT / 'models/food101'
    output.mkdir(parents=True, exist_ok=True)
    if (output / 'last.pt').exists() and not args.resume and not args.prepare_only:
        raise ValueError('An existing run was found; use --resume to continue it')
    datasets.Food101._URL = 'https://data.vision.ee.ethz.ch/cvl/food-101.tar.gz'
    weights = models.EfficientNet_B0_Weights.DEFAULT
    base = datasets.Food101(ROOT / 'dataset/food101', split='train', download=True)
    if args.prepare_only:
        print(f'Prepared {len(base)} training images, {len(base.classes)} classes', flush=True)
        return
    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(224), transforms.RandomHorizontalFlip(),
        transforms.ToTensor(), transforms.Normalize([.485, .456, .406], [.229, .224, .225])])
    train_data = datasets.Food101(base.root, split='train', transform=train_transform)
    validation_data = datasets.Food101(base.root, split='train', transform=weights.transforms())
    train_indices, validation_indices = [], []
    rng = random.Random(args.seed)
    for label in range(len(base.classes)):
        indices = [i for i, target in enumerate(base._labels) if target == label]
        rng.shuffle(indices)
        validation_indices.extend(indices[:75])
        train_indices.extend(indices[75:])
    options = dict(batch_size=args.batch_size, num_workers=args.workers,
                   pin_memory=torch.cuda.is_available(), persistent_workers=args.workers > 0)
    generator = torch.Generator().manual_seed(args.seed)
    train_loader = DataLoader(Subset(train_data, train_indices), shuffle=True, generator=generator, **options)
    validation_loader = DataLoader(Subset(validation_data, validation_indices), **options)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f'Device: {device}; train={len(train_indices)}, validation={len(validation_indices)}', flush=True)
    model = models.efficientnet_b0(weights=None if args.resume else weights)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, len(base.classes))
    model.to(device)
    optimizer = torch.optim.AdamW([
        {'params': model.features.parameters(), 'lr': 1e-4},
        {'params': model.classifier.parameters(), 'lr': 1e-3}], weight_decay=1e-4)
    scaler = torch.amp.GradScaler('cuda', enabled=device.type == 'cuda')
    start, best, history = 0, -1.0, []
    if args.resume:
        checkpoint = torch.load(args.resume, map_location=device, weights_only=True)
        if checkpoint['classes'] != base.classes or checkpoint['seed'] != args.seed:
            raise ValueError('Checkpoint classes/seed do not match this run')
        model.load_state_dict(checkpoint['model'])
        optimizer.load_state_dict(checkpoint['optimizer'])
        scaler.load_state_dict(checkpoint['scaler'])
        start, best, history = checkpoint['epoch'], checkpoint['best_accuracy'], checkpoint['history']
        torch.set_rng_state(checkpoint['rng'].cpu())
        generator.set_state(checkpoint['loader_rng'].cpu())
        random.setstate(checkpoint['python_rng'])
        if device.type == 'cuda':
            torch.cuda.set_rng_state_all([state.cpu() for state in checkpoint['cuda_rng']])
    metadata = dict(architecture='efficientnet_b0', dataset='Food-101',
                    source='https://data.vision.ee.ethz.ch/cvl/datasets_extra/food-101/',
                    seed=args.seed, classes=base.classes, train_rows=len(train_indices),
                    validation_rows=len(validation_indices), test_rows=25250,
                    selection_metric='validation accuracy', torch_version=str(torch.__version__),
                    device=str(device), epochs=args.epochs, batch_size=args.batch_size,
                    scope='Single food classification; no portion or calorie labels')
    save_json(output / 'metadata.json', metadata)
    for epoch in range(start, args.epochs):
        began = time.time()
        print(f'Epoch {epoch + 1}/{args.epochs}', flush=True)
        train_metrics = run_epoch(model, train_loader, device, optimizer, scaler)
        validation_metrics = run_epoch(model, validation_loader, device)
        improved = validation_metrics['accuracy'] > best
        best = max(best, validation_metrics['accuracy'])
        history.append(dict(epoch=epoch + 1, train=train_metrics, validation=validation_metrics,
                            seconds=time.time() - began))
        checkpoint = dict(model=model.state_dict(), optimizer=optimizer.state_dict(),
                          scaler=scaler.state_dict(), epoch=epoch + 1, best_accuracy=best,
                          classes=base.classes, seed=args.seed, history=history,
                          rng=torch.get_rng_state(), loader_rng=generator.get_state(),
                          python_rng=random.getstate(),
                          cuda_rng=torch.cuda.get_rng_state_all() if device.type == 'cuda' else [])
        temporary = output / 'last.tmp'
        torch.save(checkpoint, temporary)
        temporary.replace(output / 'last.pt')
        if improved:
            torch.save(checkpoint, output / 'best.pt')
        save_json(output / 'history.json', history)
        print(json.dumps(history[-1]), flush=True)
    checkpoint = torch.load(output / 'best.pt', map_location=device, weights_only=True)
    model.load_state_dict(checkpoint['model'])
    test_data = datasets.Food101(base.root, split='test', transform=weights.transforms())
    test_metrics = run_epoch(model, DataLoader(test_data, **options), device)
    save_json(output / 'test_metrics.json', dict(best_epoch=checkpoint['epoch'], **test_metrics))
    print(f'Test: {test_metrics}', flush=True)


if __name__ == '__main__':
    main()
