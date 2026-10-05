import { measurementView, type MeasurementRow } from "../measurements/service.js";

export function recommendation(m: MeasurementRow | null, userId: string, now = Date.now()) {
  const reading = m ? measurementView(m, now) : null;
  let headline = "Đo chỉ số để bổ sung dữ liệu";
  let detail = "Hồ sơ và BMI là thông tin ban đầu. Chưa có kết quả đo hợp lệ.";
  let riskLevel = "normal";
  if (reading && m) {
    if (reading.status === "pending") {
      headline = "Đang chờ kết quả đo";
      detail = "Chưa tạo gợi ý khi phiên đo chưa hoàn tất.";
    } else if (reading.status !== "completed") {
      headline = "Cần một phiên đo mới";
      detail = "Phiên đo lỗi, bị hủy hoặc hết hạn không được dùng để tạo gợi ý.";
    } else if (reading.stale) {
      headline = "Hãy cập nhật lần đo mới";
      detail = "Số đo đã quá 15 phút, mốc làm mới của ứng dụng.";
    } else if (m.source === "device") {
      headline = "Đã ghi nhận số đo từ thiết bị";
      detail =
        "Chưa triển khai mô hình đánh giá sức khỏe. Dữ liệu được lưu để theo dõi, không dùng để chẩn đoán hoặc xác nhận đủ điều kiện tập luyện.";
    } else if (m.scenario === "high" || m.scenario === "oxygen") {
      riskLevel = "warning";
      headline = "Kịch bản mô phỏng cần kiểm tra lại";
      detail =
        "Tạm ẩn gợi ý vận động. Bổ sung bối cảnh và thực hiện phiên đo mới; đây là dữ liệu minh họa.";
    } else if (m.context === "unknown") {
      headline = "Bổ sung bối cảnh lúc đo";
      detail = "Bạn đang nghỉ hay vừa vận động?";
    } else if (m.context === "exercise") {
      headline = "Đã ghi nhận bối cảnh vận động";
      detail = "Cần một lần đo mới khi đang nghỉ để bổ sung thông tin.";
    } else {
      headline = "Đã hoàn tất phiên mô phỏng";
      detail =
        "Theo dõi lịch cân hằng tuần và mục tiêu cá nhân. Kết quả mẫu không xác nhận tình trạng sức khỏe.";
    }
  }
  return {
    id: m?.id ?? userId,
    headline,
    detail,
    tips: [] as string[],
    riskLevel,
    generatedAt: new Date(now),
    provider: "rules",
    reading,
  };
}
