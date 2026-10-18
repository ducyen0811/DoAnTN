# Test ESP32 / MAX30102 cuối tuần

Backend đã có luồng REST cho heartbeat, nhận lệnh đo và gửi kết quả. Hướng dẫn này kiểm tra backend và mạng trước; firmware đọc MAX30102 cần được tích hợp và test trên board thực tế.

## 1. Kiểm tra backend trước khi có phần cứng

```powershell
npm.cmd ci
npm.cmd run db:generate
npm.cmd run typecheck
npm.cmd test
npm.cmd run iot:smoke
```

`iot:smoke` dùng PostgreSQL trong `.env` và HTTP handler thật, không cần server đang chạy. Script tạo tài khoản và thiết bị test riêng bằng UUID, kiểm tra heartbeat → polling → lưu kết quả → từ chối gửi lại, tín hiệu lỗi, hủy phiên và đổi khóa. Dữ liệu mẫu thuộc tài khoản test và được xóa trong `finally`. Nếu bị dừng cưỡng bức, dữ liệu test có thể còn lại với email bắt đầu bằng `iot-smoke-`.

Đây là test backend; chưa chứng minh ESP32, cảm biến hoặc Wi-Fi hoạt động.

## 2. Cho ESP32 truy cập PC qua Wi-Fi

1. PC và ESP32 cùng mạng LAN; tránh mạng khách có cô lập thiết bị.
2. Xem IPv4 của adapter đang dùng bằng `ipconfig`.
3. Đổi `HOST=0.0.0.0` trong `.env`, rồi chạy `npm.cmd run dev`.
4. Trên thiết bị khác cùng mạng, mở `http://<IPv4-PC>:8000/health` và kiểm tra `status: "ok"`.
5. Nếu timeout, kiểm tra Windows Firewall cho cổng TCP 8000 trên mạng Private và tính năng client isolation của router.

ESP32 dùng `http://<IPv4-PC>:8000/api/v1`, không dùng `localhost`, `127.0.0.1` hoặc `0.0.0.0` làm địa chỉ đích. `HOST` chỉ là địa chỉ server lắng nghe. Không cần sửa CORS cho firmware; CORS áp dụng cho trình duyệt. HTTP ở đây dành cho LAN thử nghiệm; triển khai ngoài LAN cần HTTPS.

## 3. Ghép thiết bị

Mở `/docs`, đăng ký hoặc đăng nhập, lấy `accessToken`, chọn **Authorize**.

```http
POST /api/v1/devices
Authorization: Bearer <accessToken>
Content-Type: application/json

{ "name": "ESP32 cuối tuần" }
```

Lưu `device.id` và `apiKey` vào cấu hình firmware. API chỉ trả key khi tạo hoặc đổi key, không trả trong danh sách hay chẩn đoán. Không commit key vào source hoặc in ra Serial log.

Để kiểm tra HTTP với key vừa tạo, điền `.env` local:

```dotenv
IOT_BASE_URL=http://<IPv4-PC>:8000
IOT_DEVICE_ID=<device.id>
IOT_DEVICE_KEY=<apiKey>
```

```powershell
npm.cmd run iot:probe
```

Probe gọi server đang chạy, xác thực thiết bị, gửi heartbeat và đọc lệnh chờ. Không tạo phiên hoặc gửi số đo giả. Heartbeat của probe đặt battery về mặc định 100%; đây không phải đo pin thật. Chạy probe từ PC chỉ kiểm tra đường mạng của PC; cần kiểm tra `/health` từ thiết bị khác để xác minh truy cập LAN.

## 4. Vòng lặp firmware

| Bước | API | Cách xử lý |
| --- | --- | --- |
| Mỗi khoảng 30 giây | `POST /iot/devices/{deviceId}/heartbeat` với `{ "batteryPercent": 85 }` | Chỉ gửi mức pin nếu firmware thực sự có dữ liệu pin; `{}` dùng mặc định 100% |
| Mỗi khoảng 2 giây | `GET /iot/devices/{deviceId}/pending` | Mảng rỗng: chờ; có lệnh: lấy ID phiên, bắt đầu đo |
| Có kết quả hợp lệ | `POST /iot/devices/{deviceId}/measurements/{measurementId}` | `{ "valid": true, "heartRateBpm": ..., "spo2Percent": ... }` |
| Không đọc được tín hiệu | Cùng endpoint gửi kết quả | `{ "valid": false }`; không thay lỗi bằng số cố định |

Tất cả API firmware dùng `X-Device-Key: <apiKey>`. UI tạo phiên bằng `POST /measurements` với `{ "source": "device", "deviceId": "..." }` và JWT của người dùng. Mỗi thiết bị chỉ có một phiên chưa hết hạn đang chờ; tạo thêm trả `409` cùng `detail.measurementId`. Hoàn thành, hủy hoặc hết hạn rồi mới tạo phiên tiếp theo.

Giới hạn đầu vào của API là HR 20–300 và SpO₂ 0–100, chỉ để validation dữ liệu; không phải ngưỡng đánh giá sức khỏe. Firmware phải dùng cờ chất lượng/hợp lệ từ xử lý cảm biến. Server ghi thời điểm nhận kết quả; timestamp không phải thời điểm lấy mẫu do ESP32 gửi.

Sau khi nhận lệnh, firmware cần nhớ ID đang xử lý để không khởi động lại phép đo mỗi lượt poll. Heartbeat tiếp tục chạy trong lúc đo; tránh chặn vòng lặp mạng quá lâu. Phiên hết hạn sau 5 phút. Mất kết nối: thử lại với khoảng chờ tăng dần có giới hạn. Khi POST timeout, thử đọc lại pending trước khi gửi lại; nếu POST trả `409`, dừng gửi kết quả của phiên đó vì nó đã kết thúc hoặc hết hạn. `401`: kiểm tra key hoặc thiết bị đã bị thu hồi.

## 5. Chẩn đoán và đổi key

```http
GET /api/v1/devices/{deviceId}/diagnostics
Authorization: Bearer <accessToken>
```

Response gồm thời gian server, lần heartbeat cuối, tuổi heartbeat, các khoảng thời gian khuyến nghị, phiên đang chờ và phiên gần nhất. Không heartbeat/kết quả hơn 60 giây thì thiết bị hiển thị disconnected. Polling không thay thế heartbeat.

```http
POST /api/v1/devices/{deviceId}/rotate-key
Authorization: Bearer <accessToken>
```

Lưu key mới vào firmware ngay; key cũ không còn dùng được. Thiết bị hiển thị disconnected cho đến heartbeat tiếp theo. Các phiên đang chờ và lịch sử vẫn còn. Thiết bị đã bị thu hồi không đổi key được; hãy tạo thiết bị mới.

## 6. Các ca cần thử trên phần cứng

- Heartbeat thành công, thiết bị hiện connected và thời gian cập nhật thay đổi.
- Tạo phiên trên Swagger/UI, ESP32 nhận đúng ID, gửi số đo thực và phiên thành completed.
- Tháo ngón tay/tín hiệu không hợp lệ: phiên invalid, HR và SpO₂ đều null.
- Hủy phiên khi ESP32 đang đo: kết quả gửi muộn trả 409.
- Tắt Wi-Fi hơn 60 giây: disconnected; bật lại và heartbeat: connected.
- Đổi key: key cũ trả 401; key mới hoạt động.
- Tạo hai phiên cùng thiết bị: chỉ một phiên được nhận.
- Dùng tài khoản khác: không xem được diagnostics hoặc đổi key của thiết bị này.

Ghi lại board, phiên bản firmware, thời gian thử, HTTP status, ID phiên và lỗi cảm biến. Các ca backend đã có test tự động; các ca đọc cảm biến và mất Wi-Fi vẫn cần xác minh trên phần cứng thật.
