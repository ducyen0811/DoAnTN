"""JSON-compatible local prediction, ready to be called by a future API."""
import argparse
import json
from functools import lru_cache
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
try:
    from .preprocess import ROOT, LABELS, FEATURES, prepare_features
except ImportError:
    from preprocess import ROOT, LABELS, FEATURES, prepare_features


@lru_cache(maxsize=4)
def _load_model(path, modified_ns):
    return joblib.load(path)['pipeline']


def predict_health(data, model_path=None):
    if not isinstance(data, dict) or not data:
        raise ValueError('Input must be a non-empty JSON object')
    required = set(FEATURES) - {'height', 'weight', 'bmi'}
    missing = [key for key in sorted(required) if data.get(key) is None]
    if missing:
        raise ValueError(f'Missing required features: {missing}')
    if data.get('bmi') is None and (data.get('height') is None or data.get('weight') is None):
        raise ValueError('Provide BMI or both height (cm) and weight (kg)')
    frame = prepare_features(pd.DataFrame([data]))
    if frame[list(required) + ['bmi']].isna().any().any():
        raise ValueError('Required prediction features cannot be NaN')
    path = Path(model_path) if model_path else ROOT / 'models/health_risk_model.pkl'
    if not path.is_file():
        raise FileNotFoundError('Model is missing. Run python src/train.py first.')
    model = _load_model(str(path.resolve()), path.stat().st_mtime_ns)
    probabilities = model.predict_proba(frame)[0]
    index = int(np.argmax(probabilities))
    label = int(model.classes_[index])
    return {'risk_level': LABELS[label], 'class': label, 'confidence': round(float(probabilities[index]), 6)}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, help='Path to JSON input')
    args = parser.parse_args()
    data = json.loads(args.input.read_text(encoding='utf-8')) if args.input else {
        'age': 25, 'gender': 1, 'height': 170, 'weight': 70, 'bmi': 24,
        'heart_rate': 80, 'spo2': 98, 'activity_level': 2,
        'temperature': 30, 'humidity': 60, 'uv_index': 5, 'aqi': 50}
    print(json.dumps(predict_health(data), indent=2))
