# HealthAI Backend — TypeScript + Prisma + PostgreSQL

Backend **Node.js / TypeScript / Express 5**, dùng **Prisma ORM 7 + PostgreSQL**.
Validation bằng Zod, Prisma Migrate quản lý schema, Swagger để thử API.
LLM sẽ train/tích hợp sau; hiện chỉ xử lý nghiệp vụ và gợi ý theo quy tắc.

## Chạy trên máy hiện tại

`.env` đã được cấu hình để kết nối database `healthai`, tài khoản `postgres`,
địa chỉ `127.0.0.1:5432`. Không commit `.env` hoặc chép mật khẩu vào source.
Database đã được tạo và migration đã chạy. Không cần Python hoặc SQLite.

```powershell
npm.cmd install
npm.cmd run db:generate
npm.cmd run dev
```

PowerShell trên máy đang chặn `npm.ps1`, nên dùng `npm.cmd`.
Trong terminal không bị chặn có thể dùng `npm` bình thường.

- API: http://localhost:8000/api/v1
- Swagger: http://localhost:8000/docs
- OpenAPI: http://localhost:8000/openapi.json
- Kiểm tra database: http://localhost:8000/health

`/health` trả `{ status: "ok", database: "postgresql", runtime: "node-typescript", orm: "prisma" }`.
Server từ chối khởi động khi chưa kết nối được PostgreSQL hoặc chưa chạy migration.

## Cài trên máy khác

Yêu cầu Node.js >= 22.12 và PostgreSQL >= 14.

```powershell
npm.cmd ci
Copy-Item .env.example .env
# Điền DATABASE_URL và JWT_SECRET trong .env.
npm.cmd run db:generate
npm.cmd run db:create
npm.cmd run db:migrate
npm.cmd run dev
```

`db:create` chỉ tạo database nếu chưa tồn tại, không thay mật khẩu hay xóa database.
`db:migrate` chạy `prisma migrate deploy`, áp dụng migration trong `prisma/migrations`.
Database hiện tại đã được đối chiếu schema và baseline `0_init`, không reset hoặc xóa dữ liệu.
Migration nền giữ nguyên các CHECK constraint của PostgreSQL; Prisma schema không biểu diễn các CHECK này.
Bảng `schema_migrations` cũ được giữ lại để bảo toàn lịch sử; Prisma quản lý lịch sử mới trong `_prisma_migrations`.

Khi sửa schema: chỉnh `prisma/schema.prisma`, chạy `npm.cmd run db:dev -- --name ten_thay_doi`,
sau đó `npm.cmd run db:generate`. Kiểm tra SQL trước khi áp dụng thay đổi lên dữ liệu thật.
Không sửa migration đã áp dụng và không dùng `migrate reset` trên database có dữ liệu cần giữ.

Mở giao diện quản lý dữ liệu: `npm.cmd run db:studio`.
`pg` còn là driver của `@prisma/adapter-pg` và công cụ tạo database; toàn bộ truy vấn nghiệp vụ dùng Prisma Client.

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd start
```

Test API dùng **PostgreSQL theo `.env`**. Mỗi test tạo tài khoản riêng bằng UUID và
dọn đúng các tài khoản đó khi kết thúc, không truncate bảng hoặc xóa dữ liệu người dùng.
Test thời tiết giả lập phản hồi dịch vụ ngoài để ổn định.
Cache thời tiết lưu tối đa 100 tọa độ trong 5 phút, gộp các request đang chờ cùng vị trí;
không cache lỗi hoặc dữ liệu cá nhân. Test riêng kiểm tra hết hạn, loại bỏ mục cũ và phục hồi sau lỗi.
Truy vấn đọc đơn dùng Prisma trực tiếp; đọc nhiều bảng dùng snapshot RepeatableRead.
Các luồng ghi cần kiểm soát xung đột vẫn dùng Serializable với retry có khoảng chờ ngắn.
`tsconfig.build.json` chỉ đưa code server vào bản build; `typecheck` vẫn kiểm tra cả test và script.
Test xác thực kiểm tra salt mật khẩu, JWT bị sửa/ký sai khóa/sai issuer/sai audience/sai thuật toán,
JWT hết hạn và thu hồi token sau logout. Migration Prisma cũng đã được thử trên database mới riêng biệt.

Lưu ý dependency: `npm audit` hiện báo 4 cảnh báo high qua `deepmerge-ts`/`mysql2` trong Prisma CLI 7.10.
`npm audit fix` chưa xử lý được trong nhánh hiện tại; không áp dụng `--force` vì sẽ đổi major Prisma.

## Cấu trúc

```text
src/
  app.ts          Express, CORS, Swagger v? x? l? l?i
  server.ts       Kh?i ??ng, ki?m tra PostgreSQL, graceful shutdown
  routes.ts       Gh?p c?c router v? ?p d?ng x?c th?c ng??i d?ng
  config.ts       ??c v? ki?m tra bi?n m?i tr??ng
  db.ts           Prisma Client v? transaction Serializable c? retry
  schemas.ts      Schema UUID v? ph?n trang d?ng chung
  security.ts     Hash SHA-256 v? t?o kh?a ng?u nhi?n d?ng chung
  constants.ts    C?c m?c th?i gian nghi?p v?
  docs.ts         OpenAPI d?ng schema t? t?ng module
  shared/http.ts  L?y user ID v? ki?m tra ID tr?n URL
  modules/
    auth/            ??ng k?, ??ng nh?p, JWT, session v? middleware
    profile/         H? s? c? nh?n
    weights/         L?ch s? c?n, BMI v? l?ch c?n ti?p theo
    devices/         Qu?n l? thi?t b?, x?c th?c kh?a v? API IoT
    measurements/    Phi?n ?o, m? ph?ng v? x? l? k?t qu?
    activity/        Ho?t ??ng theo ng?y
    dashboard/       T?ng h?p d? li?u t?ng quan
    recommendations/ G?i ? d?a tr?n k?t qu? ?o
    weather/         Open-Meteo weather / AQI v? cache
prisma/
  schema.prisma   Model, quan h?, index v? ?nh x? PostgreSQL
  migrations/     L?ch s? Prisma Migrate v? CHECK constraint
prisma.config.ts  C?u h?nh Prisma CLI
scripts/          C?ng c? t?o database ban ??u
test/             Test API PostgreSQL v? logic nghi?p v?
examples/         Client TypeScript ?? n?i UI
```

Trong m?i module, s?a endpoint t?i `routes.ts`, validation t?i `schemas.ts`,
v? logic d?ng l?i t?i `service.ts` n?u module c? ph?n t??ng ?ng.
API thi?t b? n?m ? `devices/iot.routes.ts`, d?ng `X-Device-Key`;
c?c router ng??i d?ng ???c b?o v? b?ng JWT trong `src/routes.ts`.
Khi th?m feature, t?o module v? ??ng k? router t?i `src/routes.ts`;
c?p nh?t m? t? API t?i `src/docs.ts`.


## Xác thực

Đăng ký sau khi thu thập xong cả tài khoản và hồ sơ trong UI:

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "an@example.com",
  "password": "mat-khau-cua-ban",
  "fullName": "Nguyễn An",
  "age": 24,
  "gender": "male",
  "heightCm": 172,
  "weightKg": 66.5,
  "activityLevel": "moderate",
  "healthGoal": "maintain"
}
```

Trả `{ accessToken, tokenType, expiresAt, data: { profile, entries, nextCheckInAt } }`.
Đăng nhập nhận `{ email, password }`, trả cùng cấu trúc.
Gửi `Authorization: Bearer <accessToken>` cho API cá nhân; dùng **Authorize** trên Swagger.
Mật khẩu băm bằng scrypt với salt ngẫu nhiên riêng cho mỗi tài khoản, đối chiếu bằng constant-time comparison.
Access token là **JWT ký HS256** bằng `JWT_SECRET`, gồm `sub`, `jti`, `iss`, `aud`, `iat`, `exp`;
không đưa mật khẩu hay dữ liệu sức khỏe vào payload. API kiểm tra chữ ký, thuật toán, issuer, audience và hạn dùng.
Database chỉ lưu SHA-256 của JWT để thu hồi phiên ngay khi logout.
Token hết hạn sau `SESSION_HOURS` (mặc định 24 giờ). Token opaque của bản trước không dùng được, cần đăng nhập lại.
`JWT_SECRET` đã được tạo ngẫu nhiên trong `.env` local; dùng khóa riêng cho mỗi môi trường, tối thiểu 32 ký tự.
Khi cài trên máy khác có thể tạo khóa bằng `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`
rồi điền vào `.env`. Không dùng mật khẩu PostgreSQL làm JWT secret.
Đăng ký/đăng nhập có giới hạn 30 request/IP/15 phút trong mỗi tiến trình.

## API theo UI

Các đường dẫn có prefix `/api/v1`; tên trường JSON giữ camelCase của UI.

| Endpoint | Nội dung |
| --- | --- |
| `POST /auth/register` | Tạo tài khoản, hồ sơ và mốc cân đầu tiên |
| `POST /auth/login` | Đăng nhập |
| `POST /auth/logout` | Thu hồi token hiện tại |
| `GET /auth/me` | `{ profile, entries, nextCheckInAt }` |
| `GET /dashboard` | Dữ liệu phiên, BMI, phiên đo mới nhất, gợi ý |
| `GET /profile` | Hồ sơ cá nhân |
| `PUT /profile` | Toàn bộ trường hồ sơ, không gồm id/email/password/weightKg |
| `GET /weights` | `{ entries, nextCheckInAt }` |
| `POST /weights` | `{ weight: 65.2 }`, chỉ nhận khi đủ 7 ngày |
| `GET /devices` | Thiết bị của tài khoản |
| `POST /devices` | `{ name }` → `{ device, apiKey }`, chỉ trả khóa lúc tạo |
| `DELETE /devices/{deviceId}` | Thu hồi khóa, hủy phiên chờ, giữ lịch sử |
| `POST /measurements` | `{ source: "simulation" }` hoặc `{ source: "device", deviceId }` |
| `GET /measurements?limit=50&offset=0` | Lịch sử đo mới nhất trước, tối đa 200/lần |
| `GET /measurements/latest` | Phiên mới nhất hoặc `null` |
| `GET /measurements/{measurementId}` | Trạng thái, kết quả phiên đo |
| `POST /measurements/{measurementId}/simulate` | `{ scenario: "standard" / "high" / "oxygen", valid: true }` |
| `POST /measurements/{measurementId}/cancel` | Hủy phiên chờ đo |
| `PATCH /measurements/{measurementId}/context` | `{ context: "unknown" / "resting" / "exercise" }` |
| `GET /recommendations` | Gợi ý quy tắc, `provider: "rules"`, kèm `reading` |
| `GET /activity/{YYYY-MM-DD}` | `{ date, source: "manual", data }`, chưa nhập thì `data: null` |
| `PUT /activity/{YYYY-MM-DD}` | Nhập steps, caloriesKcal, activeMinutes, stepGoal, calorieGoal |
| `GET /weather?latitude=10.8&longitude=106.6&location=HCM` | Thời tiết, UV, AQI và nguồn dữ liệu |

Lỗi trả `{ detail }`: 400 JSON sai, 401 chưa đăng nhập, 404 không có/quyền sở hữu sai,
409 xung đột nghiệp vụ, 422 dữ liệu không hợp lệ, 429 quá nhiều request, 503 thời tiết/database lỗi.
Cân quá sớm trả `detail: { message, nextCheckInAt }`.

## Logic đã xử lý

- Đăng ký tạo lần cân đầu. Lần tiếp theo cách lần lưu thành công gần nhất ít nhất 7 × 24 giờ.
  PostgreSQL cập nhật có điều kiện trong transaction; hai request đồng thời chỉ một request thành công.
- Server tính BMI, không nhận BMI/thời gian/userId tùy ý từ client. Đổi chiều cao không sửa BMI lịch sử.
- Tuổi 18–120, chiều cao 100–250 cm, cân nặng 20–300 kg; enum đúng theo UI.
- Dữ liệu cá nhân, thiết bị và phiên đo đều kiểm tra chủ sở hữu; truy vấn SQL dùng tham số.
- Phiên đo: `pending → completed | invalid | cancelled`; chưa xong sau 5 phút là `expired`.
  Phiên kết thúc không nhận thêm kết quả. `measuredAt` dùng giờ server, Unix milliseconds.
- Kết quả lỗi không có chỉ số (`heartRate`, `spo2` là `null`). Quá 15 phút là `stale`, quy tắc UX của UI.
- Mô phỏng ba bộ 76/98, 115/98, 76/92; lưu `source: "simulation"` riêng với `source: "device"`.
- Chưa train/gọi LLM. `recommendation()` xử lý trạng thái thiếu dữ liệu, chờ đo, lỗi, cũ, bối cảnh nghỉ/vận động
  và kịch bản mô phỏng. Không dùng các kịch bản demo làm ngưỡng chẩn đoán cho số đo thật.
- Hoạt động nhập riêng; MAX30102 không tự cung cấp bước chân/nhiệt độ môi trường.
- Thời tiết gọi Open-Meteo, timeout 10 giây; lỗi trả 503, không trả số liệu mock.
  UI cần hiển thị attribution Open-Meteo/CAMS. `weatherCode` giữ mã gốc ngoài bốn condition của UI.

## ESP32 / MAX30102

Thiết bị dùng header `X-Device-Key`, không dùng token đăng nhập:

1. Tạo thiết bị qua `POST /devices`, cấu hình `deviceId` và `apiKey` trên ESP32.
2. Mỗi khoảng 30 giây: `POST /iot/devices/{deviceId}/heartbeat` với `{ batteryPercent: 85 }`.
   Quá 60 giây không heartbeat/dữ liệu thì trạng thái disconnected.
3. UI tạo phiên đo nguồn `device`; ESP32 lấy `GET /iot/devices/{deviceId}/pending`.
4. ESP32 gửi `POST /iot/devices/{deviceId}/measurements/{measurementId}` với
   `{ valid: true, heartRateBpm: 76, spo2Percent: 98 }` hoặc `{ valid: false }` khi lỗi tín hiệu.
5. UI polling phiên đo để xem kết quả. Firmware cần xử lý 409 nếu phiên đã kết thúc/hủy/hết hạn.

Hiện cung cấp REST, chưa có MQTT/WebSocket hoặc firmware.

## Nối frontend

UI ở `../UI` hiện vẫn dùng mock/sessionStorage. Backend đã có API, chưa sửa code frontend.
Client mẫu: `examples/healthApi.ts`.

- `Auth.tsx`: giữ mật khẩu ở state đến lúc gửi đăng ký bước 2; đăng nhập sai hiển thị lỗi.
- `HealthSession.tsx`: chuyển signIn/completeProfile/saveWeight/signOut sang async,
  lấy profile/entries từ `/auth/me` và response server. Không lưu mật khẩu.
- `WeeklyCheckIn.tsx`: await API, xử lý 409 và dùng `nextCheckInAt`.
- `Measurement.tsx` / `Sensors.tsx`: lưu ID phiên và gọi start/simulate/cancel/context hoặc polling thiết bị.
- Thay mockWeather/mockActivity và logic gợi ý bằng API tương ứng; xử lý dữ liệu null/lỗi.
- Client mẫu giữ token trong memory, reload cần đăng nhập lại nếu chưa bổ sung cơ chế duy trì phiên.

## Docker (tùy chọn)

Máy hiện tại dùng PostgreSQL Windows, không cần Docker.
Để chạy môi trường riêng bằng Compose, thêm `POSTGRES_PASSWORD` vào `.env` và chạy
`docker compose up --build -d`. Mật khẩu trong URL cần URL-encode nếu chứa ký tự đặc biệt.
Compose tạo PostgreSQL riêng, chạy migration và bật API. Không chạy hai API cùng cổng 8000.

Các file Python/SQLite của bản trước nằm ở `.legacy-python/` để có thể khôi phục;
thư mục này bị loại khỏi Git/Docker và không tham gia chạy/build/test backend hiện tại.

Tham khảo: [Express error handling](https://expressjs.com/en/guide/error-handling/),
[Prisma Migrate](https://docs.prisma.io/docs/cli/v7/migrate),
[jose JWT verification](https://github.com/panva/jose/blob/main/docs/jwt/verify/functions/jwtVerify.md),
[Open-Meteo/CAMS](https://open-meteo.com/en/docs/air-quality-api).
