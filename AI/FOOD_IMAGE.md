# Nhận diện món ăn từ ảnh

Pipeline riêng với model phân loại rủi ro sức khỏe và chat Ollama.
Fine-tune EfficientNet-B0 pretrained ImageNet trên Food-101 chính thức:
https://data.vision.ee.ethz.ch/cvl/datasets_extra/food-101/

Food-101 có 101 lớp, 75.750 ảnh train và 25.250 ảnh test. Trích 75 ảnh/lớp
từ train làm validation (seed 42); train còn 68.175 ảnh. Chọn best checkpoint
bằng validation accuracy; chỉ đánh giá test sau khi train xong. Nhãn train
của bộ dữ liệu có nhiễu. Bộ này không bao phủ đầy đủ món Việt Nam.

Chạy từ thư mục DATN bằng PowerShell:

```powershell
# Tự cài dependencies, tải tiếp dữ liệu còn dở, rồi train 3 epochs:
& AI/.train-venv/Scripts/python.exe -u AI/src/food_training_job.py
# Hoặc chạy riêng từng bước:
& AI/.train-venv/Scripts/python.exe -m pip install -r AI/requirements-food.txt
& AI/.train-venv/Scripts/python.exe -u AI/src/prepare_food.py
& AI/.train-venv/Scripts/python.exe -u AI/src/train_food.py --epochs 3
# Train tiếp đến tổng cộng 6 epochs:
& AI/.train-venv/Scripts/python.exe -u AI/src/train_food.py --epochs 6 --resume AI/models/food101/last.pt
& AI/.train-venv/Scripts/python.exe AI/src/predict_food.py path/to/image.jpg
```

Kết quả trong `AI/models/food101/`: `last.pt`, `best.pt`, `metadata.json`,
`history.json`, `test_metrics.json`. Checkpoint last lưu optimizer, scaler
và trạng thái RNG để tiếp tục ở ranh giới epoch. Nếu dừng giữa epoch, chạy
lại từ checkpoint epoch hoàn tất trước đó. Chỉ nạp checkpoint đáng tin cậy.

Model dự đoán một món trong ảnh với top-5 điểm softmax chưa hiệu chỉnh.
Không suy khối lượng thức ăn hay kcal từ ảnh. Để tính calo cần lượng ăn
(gram) và kcal/100g từ nhãn hoặc nguồn dinh dưỡng đã xác minh, cùng dầu/sốt.
Food-101 không có nhãn calo; chưa tích hợp upload ảnh vào UI/API.
Giữ dữ liệu ảnh cho nghiên cứu đồ án; tham khảo điều kiện dữ liệu và quyền
ảnh trước khi phân phối lại.
