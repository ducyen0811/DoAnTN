# HealthAI — Smart Personal Health Monitoring (Frontend)

Frontend-only build for the graduation project *Smart Health Monitoring System*.
Sensor and weather data in this UI are simulated; the optional chat companion
connects to a local Ollama model. The main PostgreSQL backend is separate and
is not yet connected to the UI's demo sign-in.

## Trò chuyện AI hai chiều (cục bộ)

Thẻ gợi ý trên Dashboard và `/weather-ai` có ô hỏi đáp tự do, lịch sử hội thoại,
câu hỏi nhanh và trạng thái lỗi/thử lại. Tóm tắt phía trên vẫn là quy tắc demo;
câu trả lời chat do Ollama tạo, không có câu trả lời AI giả khi mất kết nối.

1. Cài Ollama từ https://ollama.com/download rồi chạy `ollama pull qwen2.5:3b`.
2. Đảm bảo Ollama đang chạy (nếu cần: `ollama serve`).
3. Trong `BE`, chạy `npm.cmd run chat` để bật dịch vụ riêng ở `127.0.0.1:8001`.
4. Trong `UI`, chạy `npm.cmd run dev`, mở `http://localhost:5173`.

Đổi model bằng `OLLAMA_MODEL` trong môi trường của dịch vụ chat hoặc `BE/.env`.
Dịch vụ chat không cần PostgreSQL. Nó chỉ bind loopback, dành cho bản demo cục bộ;
không triển khai công khai trước khi bổ sung xác thực backend thật.
Vite dev proxy chuyển `/chat-api` sang dịch vụ chat; bản build production cần reverse proxy tương ứng.

Mỗi lượt gửi tối đa 9 lượt hỏi đáp trước cùng câu hỏi mới, các trường hồ sơ cần thiết,
trạng thái và số đo hiện tại, thời tiết mẫu. Không gửi tên/email hay ghi hội thoại vào database.
Hội thoại mất khi rời trang hoặc tải lại. Model phân loại Python chưa nối vào chat.
Tham khảo giao thức: https://docs.ollama.com/api/chat.

## Stack

- React 18 + TypeScript (strict mode)
- Vite
- Tailwind CSS
- React Router v6
- Recharts
- Lucide React

## Getting started

```bash
npm install
npm run start
```

Then open the printed local URL (default `http://localhost:5173`).

- `/login` — login screen (mock auth, just navigates to the dashboard)
- `/` — main dashboard
- `/health-tracking` — weight & BMI history charts + table
- `/sensors` — IoT device status (ESP32 mock)
- `/weather-ai` — weather + AI analysis
- `/profile` — profile info + interactive BMI calculator

## Project structure

```
src/
  components/   Reusable UI building blocks (cards, layout, sidebar, header)
  pages/        One component per route
  data/         Mock data, shaped like future API responses
  types/        Shared TypeScript domain types
  lib/          Small UI helpers (status colors, etc.)
```

## Preparing for backend integration

- `src/types/health.ts` mirrors the shape a FastAPI + PostgreSQL API would return —
  reuse these types for your Pydantic/OpenAPI-generated response models.
- `src/data/mockHealthData.ts` exports plain data objects. Replace each export with
  a `fetch`/React Query call returning the same shape, and the components need no
  changes.
- Sensor data (`mockSensorReadings`, `mockSensorDevice`) is structured to match a
  typical ESP32 MQTT/REST payload — swap the mock for a polling hook or WebSocket
  subscription later.
- AI recommendation text (`mockAiRecommendation`) is separated from the presentation
  component (`AIRecommendation.tsx`), so it can be swapped for a live LLM API call.
