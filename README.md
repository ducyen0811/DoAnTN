# DoAnTN — HealthAI

Đồ án HealthAI được quản lý trong một repository, với ba module riêng:

| Thư mục | Nội dung |
| --- | --- |
| [BE](BE/README.md) | Backend Express, TypeScript, Prisma và PostgreSQL |
| [AI](AI/README.md) | Module Python huấn luyện và dự đoán mức rủi ro sức khỏe |
| [UI](UI/README.md) | Giao diện React, TypeScript và Vite |
| `doc/` | Tài liệu và test cases |

Mỗi module quản lý dependencies và chạy độc lập. Xem README trong từng thư mục để biết cách cấu hình và sử dụng.

## Bắt đầu

```sh
git clone https://github.com/ducyen0811/DoAnTN.git
cd DoAnTN
```

- Backend: vào `BE`, chạy `npm ci`, tạo `.env` từ `.env.example` và cấu hình theo `BE/README.md`.
- UI: vào `UI`, chạy `npm ci`, sau đó `npm run dev`.
- AI: cài Python và dependencies trong `AI/requirements.txt` theo `AI/README.md`.

File môi trường, dependencies, cache và build output không được đưa vào Git.
