"""Classify one food image. Calorie arithmetic requires explicit portion/label inputs."""
import argparse
import json
from pathlib import Path

import torch
from PIL import Image
from torchvision import models

ROOT = Path(__file__).resolve().parents[1]


def predict_food(image, checkpoint=ROOT / 'models/food101/best.pt'):
    saved = torch.load(checkpoint, map_location='cpu', weights_only=True)
    model = models.efficientnet_b0(weights=None)
    model.classifier[1] = torch.nn.Linear(model.classifier[1].in_features, len(saved['classes']))
    model.load_state_dict(saved['model'])
    model.eval()
    with Image.open(image) as opened:
        tensor = models.EfficientNet_B0_Weights.DEFAULT.transforms()(opened.convert('RGB'))
    with torch.inference_mode():
        values, indices = model(tensor.unsqueeze(0)).softmax(1).topk(5)
    return {'predictions': [{'food': saved['classes'][i], 'score': float(p)}
                            for p, i in zip(values[0], indices[0])],
            'calories_kcal': None, 'requires': 'portion grams and verified kcal_per_100g',
            'note': 'Scores are uncalibrated; model supports one Food-101 dish per image.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('image', type=Path)
    parser.add_argument('--checkpoint', type=Path, default=ROOT / 'models/food101/best.pt')
    args = parser.parse_args()
    print(json.dumps(predict_food(args.image, args.checkpoint), ensure_ascii=False, indent=2))
