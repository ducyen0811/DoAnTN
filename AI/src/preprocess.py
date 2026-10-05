"""Shared feature contract and preprocessing fitted only on training data."""
import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

try:
    from .generate_dataset import FEATURES, ROOT
except ImportError:
    from generate_dataset import FEATURES, ROOT

LABELS = {0: 'Normal', 1: 'Warning', 2: 'High Risk'}
BOUNDS = {'age': (18, 100), 'gender': (0, 1), 'height': (100, 250),
          'weight': (25, 350), 'bmi': (10, 80), 'heart_rate': (25, 240),
          'spo2': (50, 100), 'activity_level': (0, 2), 'temperature': (-30, 60),
          'humidity': (0, 100), 'uv_index': (0, 25), 'aqi': (0, 500)}


def prepare_features(frame):
    frame = frame.copy()
    unknown = set(frame.columns) - set(FEATURES)
    if unknown:
        raise ValueError(f'Unknown features: {sorted(unknown)}')
    frame = frame.reindex(columns=FEATURES)
    frame['gender'] = frame['gender'].replace({'female': 0, 'male': 1})
    for name in FEATURES:
        frame[name] = pd.to_numeric(frame[name], errors='raise')
        values = frame[name].dropna()
        low, high = BOUNDS[name]
        if not np.isfinite(values).all() or not values.between(low, high).all():
            raise ValueError(f'{name} must be finite and within [{low}, {high}]')
    for name in ['gender', 'activity_level']:
        if not frame[name].dropna().isin(range(int(BOUNDS[name][1]) + 1)).all():
            raise ValueError(f'{name} must use integer category codes')
    calculated = frame.weight / (frame.height / 100) ** 2
    # Explicit BMI is retained; calculate only when absent.
    frame['bmi'] = frame.bmi.fillna(calculated)
    if not frame.bmi.dropna().between(10, 80).all():
        raise ValueError('Calculated BMI is outside the supported range')
    return frame


def load_dataset(path):
    frame = pd.read_csv(path)
    if 'health_label' not in frame:
        raise ValueError('Missing health_label')
    labels = frame.pop('health_label').replace({v: k for k, v in LABELS.items()})
    labels = pd.to_numeric(labels, errors='raise')
    if labels.isna().any() or not labels.isin(LABELS).all():
        raise ValueError('Labels must be 0/1/2 or Normal/Warning/High Risk')
    features = prepare_features(frame)
    if features.isna().all().any():
        raise ValueError('Training features cannot be entirely missing')
    if set(labels) != set(LABELS):
        raise ValueError('Dataset must contain all three classes')
    return features, labels.astype(int)


def make_pipeline(estimator, scale=False):
    return Pipeline([('imputer', SimpleImputer(strategy='median')),
                     ('scaler', StandardScaler() if scale else 'passthrough'),
                     ('classifier', estimator)])
