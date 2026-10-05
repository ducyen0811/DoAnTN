"""Generate reproducible simulated adult observations (not clinical evidence)."""
import argparse
import csv
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FEATURES = ['age', 'gender', 'height', 'weight', 'bmi', 'heart_rate',
            'spo2', 'activity_level', 'temperature', 'humidity', 'uv_index', 'aqi']


def generate_dataset(records=10000, seed=42, output=None):
    if records < 10000:
        raise ValueError('Generate at least 10,000 records.')
    rng = random.Random(seed)
    rows = []
    for _ in range(records):
        # Mixture creates coverage; labels are computed from features, not profile IDs.
        profile = rng.choices([0, 1, 2], weights=[0.45, 0.35, 0.20])[0]
        height = round(rng.uniform(145, 195), 1)
        target_bmi = rng.uniform(*[(18.5, 25), (23, 31), (27, 40)][profile])
        weight = round(target_bmi * (height / 100) ** 2, 1)
        bmi = round(weight / (height / 100) ** 2, 2)
        hr = round(rng.uniform(*[(60, 92), (80, 108), (92, 135)][profile]), 1)
        spo2 = round(rng.uniform(*[(97, 100), (94, 99), (89, 97)][profile]), 1)
        activity = rng.choices([0, 1, 2], weights=[(1, 3, 6), (5, 4, 1), (6, 3, 1)][profile])[0]
        temperature = round(rng.uniform(15, 42), 1)
        humidity = round(rng.uniform(25, 95), 1)
        uv = round(rng.uniform(0, 12), 1)
        aqi = round(rng.uniform(5, 220), 1)
        age = rng.randint(18, 85)
        # Deliberately illustrative rules. Never use these as medical thresholds.
        score = (int(bmi >= 25 or bmi < 18.5) + int(bmi > 30)
                 + int(hr > 90 or hr < 60) + int(hr > 100)
                 + int(spo2 < 97) + 2 * int(spo2 < 95)
                 + int(activity == 0) + int(age >= 65)
                 + int(temperature >= 35 and humidity >= 75)
                 + int(uv >= 8) + int(aqi > 100))
        label = 2 if score >= 6 or spo2 < 92 else (1 if score >= 3 else 0)
        rows.append([age, rng.randint(0, 1), height, weight, bmi, hr, spo2,
                     activity, temperature, humidity, uv, aqi, label])
    path = Path(output) if output else ROOT / 'dataset/health_dataset.csv'
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', newline='', encoding='utf-8') as stream:
        writer = csv.writer(stream)
        writer.writerow(FEATURES + ['health_label'])
        writer.writerows(rows)
    print(f'Saved {len(rows)} synthetic records to {path}')
    return path


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--records', type=int, default=10000)
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    generate_dataset(args.records, args.seed, args.output)
