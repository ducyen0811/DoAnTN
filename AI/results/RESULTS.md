# Kết quả thực nghiệm

Dataset tổng hợp: 10.000 dòng, seed 42; train 8.000, test 2.000, stratified. Phân bố toàn bộ dataset: Normal 4.265, Warning 2.821, High Risk 2.914.

| Mô hình | CV macro F1 (train) | Test accuracy | Test macro precision | Test macro recall | Test macro F1 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Random Forest | 0.934248 | 0.937500 | 0.932935 | 0.935458 | 0.933297 |
| Logistic Regression | 0.862307 | 0.858000 | 0.854825 | 0.855249 | 0.853935 |
| Decision Tree | 0.929712 | 0.931000 | 0.924438 | 0.925133 | 0.924740 |

Chọn **Random Forest** theo macro F1 trung bình trên 5 folds của train. Độ lệch chuẩn CV macro F1 của Random Forest: 0.003413. XGBoost không được cài, nên không có kết quả XGBoost.

Model được lưu tại `models/health_risk_model.pkl`. Báo cáo từng lớp nằm trong `classification_report.json`; biểu đồ confusion matrix, accuracy và permutation importance nằm cùng thư mục này.

Đây là kết quả chạy thực tế trên nhãn tổng hợp do quy tắc tạo ra. Không diễn giải accuracy 93,75% là độ chính xác phát hiện bệnh trên người thật. Confidence chưa được hiệu chỉnh. Khi sinh dataset khác hoặc thay phiên bản thư viện, cần chạy lại train và cập nhật bảng này; CSV/JSON do chương trình tạo là nguồn kết quả của lần chạy mới nhất.
