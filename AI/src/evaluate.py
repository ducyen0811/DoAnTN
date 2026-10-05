"""Save held-out metrics and plots; never use test scores for model selection."""
import json
import joblib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from sklearn.inspection import permutation_importance
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
try:
    from .preprocess import ROOT, LABELS, FEATURES
except ImportError:
    from preprocess import ROOT, LABELS, FEATURES


def evaluate_models(models, X_test, y_test, selected):
    output = ROOT / 'results'
    output.mkdir(exist_ok=True)
    reports, comparison = {}, []
    for name, model in models.items():
        prediction = model.predict(X_test)
        report = classification_report(y_test, prediction, labels=list(LABELS),
                                       target_names=list(LABELS.values()), output_dict=True, zero_division=0)
        reports[name] = report
        comparison.append({'model': name, 'accuracy': accuracy_score(y_test, prediction),
                           **{metric: report['macro avg'][metric] for metric in ['precision', 'recall', 'f1-score']}})
        fig, ax = plt.subplots(figsize=(6, 5))
        sns.heatmap(confusion_matrix(y_test, prediction, labels=list(LABELS)), annot=True,
                    fmt='d', cmap='Blues', xticklabels=list(LABELS.values()),
                    yticklabels=list(LABELS.values()), ax=ax)
        ax.set(xlabel='Predicted', ylabel='Actual synthetic label', title=name)
        fig.tight_layout()
        fig.savefig(output / f"confusion_matrix_{name.lower().replace(' ', '_')}.png", dpi=160)
        plt.close(fig)
    (output / 'classification_report.json').write_text(json.dumps(reports, indent=2), encoding='utf-8')
    table = pd.DataFrame(comparison)
    table.to_csv(output / 'model_comparison.csv', index=False)
    fig, ax = plt.subplots(figsize=(9, 5))
    sns.barplot(data=table, x='model', y='accuracy', ax=ax)
    ax.set(ylim=(0, 1), title='Held-out synthetic test accuracy (selection uses training CV)')
    fig.tight_layout()
    fig.savefig(output / 'accuracy_comparison.png', dpi=160)
    plt.close(fig)
    importance = permutation_importance(models[selected], X_test, y_test,
                                        scoring='f1_macro', n_repeats=5, random_state=42, n_jobs=1)
    table = pd.DataFrame({'feature': FEATURES, 'mean_f1_decrease': importance.importances_mean,
                          'std': importance.importances_std}).sort_values('mean_f1_decrease')
    table.to_csv(output / 'feature_importance.csv', index=False)
    fig, ax = plt.subplots(figsize=(9, 6))
    ax.barh(table.feature, table.mean_f1_decrease, xerr=table['std'])
    ax.set(xlabel='Decrease in macro F1 when shuffled', title=f'Permutation importance: {selected}')
    fig.tight_layout()
    fig.savefig(output / 'feature_importance.png', dpi=160)
    plt.close(fig)
    print(pd.DataFrame(comparison).to_string(index=False))


def main():
    bundle = joblib.load(ROOT / 'models/evaluation_bundle.pkl')
    evaluate_models(bundle['models'], bundle['X_test'], bundle['y_test'], bundle['selected_model'])


if __name__ == '__main__':
    main()
