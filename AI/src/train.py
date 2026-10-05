"""Select by training CV macro F1; evaluate once on the held-out 20%."""
import argparse
import hashlib
import json
import platform
import joblib
import sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split

try:
    from .preprocess import ROOT, FEATURES, LABELS, load_dataset, make_pipeline
    from .evaluate import evaluate_models
except ImportError:
    from preprocess import ROOT, FEATURES, LABELS, load_dataset, make_pipeline
    from evaluate import evaluate_models


def train(dataset=ROOT / 'dataset/health_dataset.csv', seed=42):
    X, y = load_dataset(dataset)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=seed, stratify=y)
    candidates = {
        'Random Forest': make_pipeline(RandomForestClassifier(
            n_estimators=250, min_samples_leaf=2, class_weight='balanced',
            random_state=seed, n_jobs=-1)),
        'Logistic Regression': make_pipeline(LogisticRegression(
            max_iter=2000, class_weight='balanced', random_state=seed), scale=True),
        'Decision Tree': make_pipeline(DecisionTreeClassifier(
            max_depth=12, min_samples_leaf=5, class_weight='balanced', random_state=seed))}
    try:
        from xgboost import XGBClassifier
    except ImportError:
        print('XGBoost unavailable: comparing the three required models.')
    else:
        candidates['XGBoost'] = make_pipeline(XGBClassifier(
            n_estimators=200, max_depth=4, learning_rate=0.08,
            objective='multi:softprob', eval_metric='mlogloss', random_state=seed, n_jobs=2))
    scores = {}
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=seed)
    for name, model in candidates.items():
        result = cross_validate(model, X_train, y_train, cv=cv,
                                scoring=['accuracy', 'precision_macro', 'recall_macro', 'f1_macro'],
                                error_score='raise', n_jobs=1)
        scores[name] = {key.removeprefix('test_'): float(value.mean())
                        for key, value in result.items() if key.startswith('test_')}
        scores[name]['f1_macro_std'] = float(result['test_f1_macro'].std())
        model.fit(X_train, y_train)
        print(name, scores[name])
    winner = max(scores, key=lambda name: scores[name]['f1_macro'])
    metadata = {'selected_model': winner, 'selection_metric': '5-fold training CV macro F1',
                'cv_scores': scores, 'seed': seed, 'features': FEATURES, 'labels': LABELS,
                'train_rows': len(X_train), 'test_rows': len(X_test),
                'dataset_sha256': hashlib.sha256(dataset.read_bytes()).hexdigest(),
                'python_version': platform.python_version(), 'sklearn_version': sklearn.__version__,
                'data_provenance': 'See dataset documentation; default dataset is synthetic'}
    (ROOT / 'models').mkdir(exist_ok=True)
    joblib.dump({'pipeline': candidates[winner], 'metadata': metadata}, ROOT / 'models/health_risk_model.pkl')
    joblib.dump({'models': candidates, 'X_test': X_test, 'y_test': y_test,
                 'selected_model': winner}, ROOT / 'models/evaluation_bundle.pkl')
    (ROOT / 'models/training_metadata.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')
    evaluate_models(candidates, X_test, y_test, winner)
    print(f'Selected: {winner}')


if __name__ == '__main__':
    from pathlib import Path
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dataset', type=Path, default=ROOT / 'dataset/health_dataset.csv')
    parser.add_argument('--seed', type=int, default=42)
    args = parser.parse_args()
    train(args.dataset, args.seed)
