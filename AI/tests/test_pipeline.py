"""Contract checks using the actual trained model."""
import unittest
import pandas as pd
from src.predict import predict_health
from src.preprocess import prepare_features

SAMPLE = {'age': 25, 'gender': 1, 'height': 170, 'weight': 70,
          'heart_rate': 80, 'spo2': 98, 'activity_level': 2,
          'temperature': 30, 'humidity': 60, 'uv_index': 5, 'aqi': 50}


class PredictionTests(unittest.TestCase):
    def test_bmi_calculation(self):
        row = prepare_features(pd.DataFrame([SAMPLE]))
        self.assertAlmostEqual(row.bmi.iloc[0], 70 / 1.7 ** 2)

    def test_prediction_contract(self):
        result = predict_health(SAMPLE)
        self.assertIn(result['class'], [0, 1, 2])
        self.assertEqual(result['risk_level'], ['Normal', 'Warning', 'High Risk'][result['class']])
        self.assertTrue(0 <= result['confidence'] <= 1)
        self.assertEqual(result, predict_health(SAMPLE))

    def test_bmi_without_dimensions(self):
        data = {key: value for key, value in SAMPLE.items() if key not in ['height', 'weight']}
        self.assertIn(predict_health({**data, 'bmi': 24})['class'], [0, 1, 2])

    def test_bad_inputs(self):
        for update in [{'spo2': 101}, {'gender': 0.5}, {'activity_level': 3},
                       {'heart_rate': float('inf')}, {'spo2': float('nan')},
                       {'health_label': 2}, {'heart_rate': None}]:
            with self.subTest(update=update), self.assertRaises(ValueError):
                predict_health({**SAMPLE, **update})
        with self.assertRaises(ValueError):
            predict_health({})


if __name__ == '__main__':
    unittest.main()
