# AI — Phân loại mức rủi ro sức khỏe

Module Python chạy cục bộ, không gọi LLM, OpenAI hay Gemini. Đầu ra: `0 = Normal`, `1 = Warning`, `2 = High Risk`.

## Cài đặt và chạy

Từ thư mục `AI`, với Python 3.11–3.13:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python src/generate_dataset.py --records 10000 --seed 42
python src/train.py
python src/evaluate.py
python src/predict.py
python -m unittest discover -s tests
```

Cài `xgboost` nếu muốn so sánh thêm; nếu không cài, vẫn huấn luyện đủ ba mô hình bắt buộc. Cài `jupyter` để mở `notebooks/model_analysis.ipynb`. Có thể dùng `python src/evaluation.py` thay cho `evaluate.py`.

Trên máy hiện tại, `python` trỏ tới Windows Store và bản Python trong pgAdmin không có `venv`. Thư viện đã được cài riêng bằng `pip --target AI/.venv/Lib/site-packages`, không thay đổi thư viện của pgAdmin. Có thể chạy từ thư mục gốc DATN bằng:

```powershell
$aiPython = 'C:\Users\Admin\AppData\Local\Programs\pgAdmin 4\python\python.exe'
& $aiPython AI/run_local.py src/train.py
& $aiPython AI/run_local.py src/predict.py
& $aiPython AI/run_local.py tests/test_pipeline.py
```

`run_local.py` chỉ thêm thư mục thư viện cục bộ vào đường dẫn import. Khi chuyển máy, nên dùng bản Python độc lập và quy trình venv ở trên.

## Dữ liệu và đơn vị

`dataset/health_dataset.csv` chứa 10.000 bản ghi người trưởng thành giả lập. Seed giúp tái tạo dữ liệu. Bộ sinh chỉ dùng thư viện chuẩn Python.

| Trường | Ý nghĩa |
| --- | --- |
| age | Tuổi, dữ liệu sinh từ 18–85 |
| gender | 0: female, 1: male; mã hóa đơn giản phục vụ mô phỏng |
| height, weight | cm, kg |
| bmi | kg/m², tính từ cân nặng và chiều cao trong dataset |
| heart_rate | Nhịp/phút |
| spo2 | % |
| activity_level | 0: thấp, 1: nhẹ, 2: vừa; là mã mức hoạt động, không phải phép đo chuẩn hóa |
| temperature | Nhiệt độ môi trường °C, không phải thân nhiệt |
| humidity | Độ ẩm tương đối % |
| uv_index, aqi | Chỉ số UV và AQI mô phỏng; chưa gắn chuẩn AQI quốc gia |
| health_label | Nhãn mục tiêu 0/1/2 |

Nhãn được tính bằng tổng điểm minh họa trong `generate_dataset.py`: BMI, nhịp tim, SpO₂, hoạt động, tuổi và môi trường đóng góp vào điểm; điểm ≥6 hoặc SpO₂ <92 cho lớp 2, điểm ≥3 cho lớp 1, còn lại lớp 0. Đây là quy tắc do dự án đặt ra, không phải nhãn bác sĩ hoặc tiêu chuẩn y khoa. Có các vùng đặc trưng chồng lấn nhưng không thêm nhiễu nhãn ngẫu nhiên để làm đẹp/xấu điểm số.

## Cách mô hình hoạt động

Chọn đúng 12 đầu vào, loại nhãn khỏi đặc trưng. Gender hỗ trợ mã số và chuỗi `female`/`male`; nhãn hỗ trợ số hoặc tên lớp. Kiểm tra miền giá trị và điền thiếu bằng median học trên dữ liệu train. BMI được tính khi thiếu và có đủ chiều cao/cân nặng; nếu đã truyền BMI thì giữ giá trị này. Logistic Regression thêm StandardScaler; mô hình cây không cần scaling.

Chia stratified 80% train / 20% test. Trong 80% train, so sánh bằng 5-fold cross-validation macro F1. Imputer và scaler được fit riêng trong mỗi fold bằng Pipeline, tránh rò rỉ dữ liệu. Huấn luyện lại từng ứng viên trên toàn bộ 80% train. Chọn mô hình có CV macro F1 cao nhất, ưu tiên Random Forest khi hòa do thứ tự khai báo. Không chọn mô hình bằng điểm test.

Random Forest kết hợp nhiều cây quyết định để phân loại. Logistic Regression học ranh giới tuyến tính, Decision Tree học các phép chia đặc trưng. File `models/health_risk_model.pkl` lưu toàn bộ pipeline của mô hình thắng cùng metadata; mô hình thắng có thể không phải Random Forest. `models/evaluation_bundle.pkl` giữ các mô hình và tập test để tái tạo báo cáo. Metadata có seed, checksum dataset và phiên bản scikit-learn. Chỉ tải file joblib/pickle đáng tin cậy.

## Kết quả và giải thích

Sau khi train, `results/` chứa:

- `model_comparison.csv`: accuracy, macro precision, macro recall, macro F1 trên test.
- `classification_report.json`: precision/recall/F1/support cho từng lớp của từng mô hình.
- `confusion_matrix_*.png`, `accuracy_comparison.png`.
- `feature_importance.csv`, `feature_importance.png`: mức giảm macro F1 khi hoán vị từng đặc trưng, 5 lần lặp.

Importance được đo thực tế, không gán trước BMI 35% hay nhịp tim 25%. Đặc trưng tương quan (height/weight/BMI) có thể chia sẻ importance; importance không chứng minh quan hệ nhân quả. CV scores nằm trong `models/training_metadata.json`.

## Sử dụng và tích hợp FastAPI sau này

Từ thư mục AI:

```python
from src.predict import predict_health

result = predict_health({
    'age': 25, 'gender': 1, 'height': 170, 'weight': 70, 'bmi': 24,
    'heart_rate': 80, 'spo2': 98, 'activity_level': 2,
    'temperature': 30, 'humidity': 60, 'uv_index': 5, 'aqi': 50,
})
print(result)
```

Kết quả có `risk_level`, `class`, `confidence`. Confidence là xác suất đầu ra mô hình chưa hiệu chỉnh, không phải xác suất bệnh hoặc mức bảo đảm chính xác. Các số 0.86/0.92 trong yêu cầu chỉ là minh họa; mã không hardcode chúng.

Hàm kiểm tra các trường bắt buộc, từ chối trường lạ, NaN bắt buộc, vô cực, category hoặc giá trị ngoài miền. Chiều cao/cân nặng được phép thiếu nếu đã có BMI, như ví dụ đầu trong yêu cầu, và được impute bằng median train. Tốt nhất gửi đủ 12 trường. Model được cache và nạp lại khi file thay đổi.

Ví dụ adapter tương lai (cài riêng `fastapi`, `uvicorn`):

```python
from fastapi import FastAPI, HTTPException
from src.predict import predict_health

app = FastAPI()

@app.post('/predict-health')
def predict(data: dict):
    try:
        return predict_health(data)
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
```

## Phạm vi đồ án

Kết quả trên dữ liệu tổng hợp chỉ thể hiện mô hình học lại quy tắc sinh nhãn. Chưa có xác thực lâm sàng, dữ liệu bệnh nhân, hoặc kiểm định thiết bị; không sử dụng module này để chẩn đoán hay quyết định điều trị. Dữ liệu hiện tại không mô phỏng chuỗi thời gian hoặc nhiều lần đo của cùng người. Khi có dữ liệu thật, cần nhãn chuyên môn, chia train/test theo người hoặc thời gian, kiểm tra sai lệch nhóm, hiệu chỉnh xác suất và đánh giá trên tập độc lập trước khi triển khai.
