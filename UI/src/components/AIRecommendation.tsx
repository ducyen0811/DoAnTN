import { Link } from "react-router-dom";
import { useMeasurement } from "@/context/Measurement";
import { useHealthSession } from "@/context/HealthSession";
import { healthGoals } from "@/lib/healthProfile";
import { mockWeather } from "@/data/mockHealthData";
import HealthChat from "./HealthChat";

export default function AIRecommendation() {
  const { reading, pending, invalid, stale, setContext } = useMeasurement();
  const { data } = useHealthSession();
  const attention = !!reading && reading.scenario !== "standard";
  const ready = !!reading && !pending && !invalid && !stale;
  const goal = data?.profile.healthGoal;
  const goalPlans = {
    maintain: "Duy trì lịch vận động quen thuộc và ghi lại mức độ thoải mái sau mỗi buổi để điều chỉnh kế hoạch.",
    lose: "Theo dõi cân nặng ở lần cập nhật hằng tuần và duy trì lịch vận động đều đặn; một lần đo nhịp tim không cho biết hiệu quả giảm cân.",
    gain: "Theo dõi cân nặng hằng tuần và ghi lại việc ăn uống, tập luyện để đánh giá tiến độ tăng cân.",
    fitness: "Ghi lại thời lượng, cường độ và cảm nhận sau mỗi buổi tập; so sánh các lần đo trong cùng bối cảnh để theo dõi thay đổi.",
  };
  const weatherDetail = mockWeather.temperatureC >= 35 || mockWeather.uvIndex >= 8
    ? `Dữ liệu thời tiết mẫu: ${mockWeather.temperatureC}°C, UV ${mockWeather.uvIndex}. Ưu tiên không gian trong nhà nếu bạn có kế hoạch vận động; kiểm tra thời tiết thực tế trước khi ra ngoài.`
    : mockWeather.condition === "rainy"
      ? "Dữ liệu mẫu có mưa. Cân nhắc địa điểm có mái che và kiểm tra thời tiết thực tế trước khi ra ngoài."
      : `Dữ liệu thời tiết mẫu: ${mockWeather.temperatureC}°C, UV ${mockWeather.uvIndex}. Chọn địa điểm theo điều kiện thực tế tại nơi bạn ở.`;
  let title = "Đo chỉ số để có gợi ý phù hợp hơn";
  let detail = "Hồ sơ và BMI là thông tin ban đầu. Hãy đo nhịp tim và SpO₂ để bổ sung dữ liệu trước khi nhận gợi ý hoạt động.";
  if (pending) { title = "Đang chờ kết quả đo"; detail = "Chưa đưa ra nhận xét khi phiên đo chưa hoàn tất."; }
  else if (invalid) { title = "Cần đo lại để có dữ liệu hợp lệ"; detail = "Tín hiệu vừa thu chưa đạt yêu cầu. Hãy kiểm tra vị trí ngón tay và thử lại."; }
  else if (stale) { title = "Hãy cập nhật lần đo mới"; detail = "Số đo này đã quá 15 phút — mốc làm mới của bản demo, không phải tiêu chuẩn y khoa. Đo lại để cập nhật gợi ý cho thời điểm hiện tại."; }
  else if (reading?.scenario === "oxygen") { title = "Kịch bản SpO₂ cần chú ý"; detail = "Bản demo tạm ẩn gợi ý vận động và ưu tiên kiểm tra lại phép đo. Một số đo đơn lẻ không đủ để kết luận tình trạng sức khỏe."; }
  else if (reading?.scenario === "high") {
    title = "Kịch bản nhịp tim cao: cần thêm bối cảnh";
    detail = reading.context === "unknown" ? "Bạn vừa vận động hay đang nghỉ? Thông tin này giúp diễn giải kết quả; hiện chưa đưa ra gợi ý tập luyện."
      : reading.context === "exercise" ? "Đã ghi nhận bạn vừa vận động. Cần một lần đo mới khi đang nghỉ để bổ sung thông tin; chưa thể suy ra rằng kết quả này an toàn."
      : "Đã ghi nhận bạn đang nghỉ. Kịch bản này ưu tiên xác minh lại số đo và tạm ẩn gợi ý tập luyện, thay vì khuyến nghị vận động chung.";
  } else if (reading) {
    title = reading.context === "unknown" ? "Bạn đo khi nghỉ hay sau vận động?" : reading.context === "exercise" ? "Theo dõi hồi phục sau vận động" : "Theo dõi hôm nay, lập kế hoạch theo mục tiêu";
    detail = reading.context === "unknown" ? "Cho biết bạn đang nghỉ hay vừa vận động trước khi xem gợi ý. Hai chỉ số không đủ để xác nhận sức khỏe tổng thể."
      : reading.context === "exercise" ? `Nhịp tim ${reading.heartRate} BPM và SpO₂ ${reading.spo2}% được ghi nhận sau vận động. Không nên so trực tiếp với lần đo lúc nghỉ; cần một lần đo trong cùng bối cảnh để theo dõi thay đổi.`
      : `Phiên đo lúc nghỉ ghi nhận nhịp tim ${reading.heartRate} BPM và SpO₂ ${reading.spo2}%. Đây là một mốc để theo dõi những lần đo sau, chưa đủ để đánh giá thể lực hoặc quyết định cường độ tập.`;
  }
  return <section className={`rounded-xl2 border p-6 lg:col-span-2 ${attention && !stale ? "border-warning-500/30 bg-warning-50" : "border-ink-900/10 bg-surface"}`}>
    <p className="text-xs font-medium text-ink-500">Tóm tắt theo quy tắc · Dữ liệu mô phỏng</p>
    <h2 className="mt-3 text-lg font-semibold">{title}</h2>
    <p className="mt-2 text-sm leading-relaxed text-ink-700">{detail}</p>
    {ready && reading.context !== "unknown" && <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-ink-900/10 bg-white/80 p-4">
        <h3 className="text-sm font-semibold">Việc tiếp theo</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-700">{attention
          ? "Kiểm tra vị trí ngón tay, giữ tay yên và đo lại khi đang nghỉ. Xác minh số đo trước khi dùng kết quả để lập kế hoạch vận động."
          : reading.context === "exercise"
            ? "Ghi lại hoạt động vừa thực hiện và cảm nhận của bạn. Sau khi nghỉ, đo lại với bối cảnh “Đang nghỉ” để có thêm dữ liệu theo dõi."
            : "Ghi lại cảm nhận của bạn ở thời điểm đo. Ở lần đo sau, giữ cùng bối cảnh nghỉ và cách đặt ngón tay để dễ so sánh kết quả."}</p>
      </div>
      <div className="rounded-xl border border-ink-900/10 bg-white/80 p-4">
        <h3 className="text-sm font-semibold">{attention ? "Kế hoạch vận động" : goal ? healthGoals[goal] : "Mục tiêu cá nhân"}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-700">{attention
          ? "Tạm hoãn gợi ý bài tập trong phiên này vì số đo cần được kiểm tra lại."
          : goal ? goalPlans[goal] : "Bổ sung mục tiêu trong hồ sơ để nhận gợi ý theo dõi phù hợp."}</p>
      </div>
    </div>}
    {ready && reading.scenario === "standard" && reading.context === "resting" && <p className="mt-3 text-sm leading-relaxed text-ink-700">{weatherDetail}</p>}
    {reading && <p className="mt-3 text-xs text-ink-500">Số đo mẫu: {reading.heartRate} BPM · SpO₂ {reading.spo2}% · {new Date(reading.measuredAt).toLocaleString("vi-VN")}</p>}
    {reading && !stale && !pending && !invalid && reading.scenario !== "oxygen" && <fieldset className="mt-4"><legend className="text-sm font-medium">Bối cảnh lúc đo</legend><div className="mt-2 flex flex-wrap gap-2">{(["resting", "exercise"] as const).map(value => <button key={value} type="button" aria-pressed={reading.context === value} onClick={() => setContext(value)} className={`rounded-xl border px-3 py-2 text-sm ${reading.context === value ? "border-primary-700 bg-primary-700 text-white" : "border-ink-900/10 bg-white"}`}>{value === "resting" ? "Đang nghỉ" : "Vừa vận động"}</button>)}</div></fieldset>}
    <Link to="/sensors" className="mt-5 inline-block rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white">{pending ? "Xem phiên đo" : reading || invalid ? "Đo lại" : "Đo ngay"}</Link>
    <HealthChat />
  </section>;
}
