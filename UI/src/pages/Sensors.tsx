import { useEffect, useState } from "react";
import { Cpu, Fingerprint, HeartPulse, Percent, Radio, RotateCcw } from "lucide-react";
import SensorCard from "@/components/SensorCard";

import { useMeasurement, type Scenario } from "@/context/Measurement";
import AIRecommendation from "@/components/AIRecommendation";
import { Link } from "react-router-dom";
type Stage = "disconnected" | "connecting" | "waiting" | "measuring" | "result" | "retry";
const labels: Record<Stage, string> = {
  disconnected: "Chưa kết nối", connecting: "Đang kết nối…", waiting: "Chờ đặt ngón tay",
  measuring: "Đang đo…", result: "Đã có kết quả", retry: "Cần đo lại",
};
const durationSeconds = 10;

export default function Sensors() {
  const { reading, begin, finish, cancel } = useMeasurement();
  const [scenario, setScenario] = useState<Scenario>("standard");
  const [stage, setStage] = useState<Stage>("disconnected");
  const [poorSignal, setPoorSignal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [measuredAt, setMeasuredAt] = useState<Date | null>(null);

  useEffect(() => {
    if (stage !== "connecting") return;
    const timer = window.setTimeout(() => setStage("waiting"), 1000);
    return () => window.clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "measuring") return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const next = Math.min(100, Math.floor((Date.now() - startedAt) / (durationSeconds * 10)));
      setProgress(next);
      if (next === 100) {
        window.clearInterval(timer);
        finish(scenario, !poorSignal);
        if (poorSignal) setStage("retry");
        else { setMeasuredAt(new Date()); setStage("result"); }
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [stage, poorSignal, scenario, finish]);

  useEffect(() => () => cancel(), [cancel]);
  function reset(next: Stage) {
    if (next === "measuring") begin(); else cancel();
    setProgress(0);
    setMeasuredAt(null);
    setStage(next);
  }

  const connected = !["disconnected", "connecting"].includes(stage);
  const ready = stage === "waiting" || stage === "retry";
  const buttonClass = "rounded-xl bg-primary-700 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-600";

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm leading-relaxed text-primary-700">
        Chế độ mô phỏng · Chưa kết nối phần cứng. Kết quả minh họa không phải số đo sức khỏe của bạn và chỉ dùng để cập nhật gợi ý demo trong phiên hiện tại; tải lại trang sẽ xóa số đo.
      </div>
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl2 bg-surface p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-primary-50 p-3 text-primary-700"><Cpu size={24} /></span>
          <div><h2 className="font-semibold">Thiết bị đo nhịp tim & SpO₂</h2><p className="mt-1 text-sm text-ink-500">ESP32 + MAX30102</p></div>
        </div>
        <span className="rounded-full bg-canvas px-3 py-2 text-sm font-medium text-ink-700">{labels[stage]}</span>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl2 bg-surface p-6 shadow-card sm:p-8">
          <div className="mb-7 flex items-center gap-2 text-xs text-ink-500 sm:text-sm" aria-label="Các bước đo">
            <span className={connected ? "text-primary-700" : "font-semibold text-ink-900"}>1. Kết nối</span><span className="h-px flex-1 bg-ink-900/10" />
            <span className={connected && stage !== "result" ? "font-semibold text-primary-700" : ""}>2. Đo chỉ số</span><span className="h-px flex-1 bg-ink-900/10" />
            <span className={stage === "result" ? "font-semibold text-primary-700" : ""}>3. Kết quả</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="mb-5 rounded-full bg-primary-50 p-5 text-primary-700">{connected ? <Fingerprint size={40} /> : <Radio size={40} />}</span>
            <h2 className="text-xl font-semibold" role="status">{labels[stage]}</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-500">
              {stage === "disconnected" && "Bắt đầu bằng cách kết nối thiết bị mô phỏng để trải nghiệm một phiên đo."}
              {stage === "connecting" && "Đang chuẩn bị thiết bị mô phỏng, vui lòng đợi một chút."}
              {stage === "waiting" && "Khi dùng thiết bị thật, đặt ngón tay nhẹ lên cảm biến và giữ yên. Trong bản demo, nhấn nút bên dưới để bắt đầu."}
              {stage === "measuring" && "Đang thu tín hiệu mô phỏng. Thanh tiến trình 10 giây chỉ dùng để minh họa giao diện."}
              {stage === "retry" && "Tín hiệu mô phỏng chưa đạt yêu cầu. Với thiết bị thật, hãy đặt lại ngón tay và giữ yên trước khi đo lại."}
              {stage === "result" && "Phiên mô phỏng đã hoàn tất. Các con số bên dưới là dữ liệu mẫu cố định, không dùng để đánh giá sức khỏe."}
            </p>
          </div>

          {stage === "measuring" && <div className="mt-6">
            <div role="progressbar" aria-label="Tiến trình đo mô phỏng" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-2.5 overflow-hidden rounded-full bg-canvas"><div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${progress}%` }} /></div>
            <p className="mt-2 text-center text-sm text-ink-500">{progress}%</p>
          </div>}

          {ready && <label className="mt-5 block text-sm font-medium">Kịch bản mô phỏng<select value={scenario} onChange={event => setScenario(event.target.value as Scenario)} className="mt-2 w-full rounded-xl border border-ink-900/10 bg-white p-3"><option value="standard">Tham khảo: 76 BPM / 98%</option><option value="high">Nhịp tim cao: 115 BPM / 98%</option><option value="oxygen">SpO₂ cần chú ý: 76 BPM / 92%</option></select></label>}
          {ready && <label className="mt-6 flex items-start gap-3 rounded-xl bg-canvas p-4 text-sm text-ink-700">
            <input type="checkbox" checked={poorSignal} onChange={event => setPoorSignal(event.target.checked)} className="mt-1 accent-primary-700" />
            <span>Thử tình huống tín hiệu kém<span className="mt-1 block text-xs text-ink-500">Bỏ chọn để thử một phiên đo thành công.</span></span>
          </label>}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {stage === "disconnected" && <button className={buttonClass} onClick={() => reset("connecting")}>Kết nối mô phỏng</button>}
            {ready && <button className={buttonClass} onClick={() => reset("measuring")}>{stage === "retry" ? "Đo lại mô phỏng" : "Đã đặt ngón tay · Bắt đầu đo"}</button>}
            {stage === "result" && <button className={`${buttonClass} flex items-center gap-2`} onClick={() => reset("waiting")}><RotateCcw size={16} />Đo phiên mới</button>}
            {stage === "measuring" && <button className="rounded-xl border border-ink-900/10 px-5 py-3 text-sm font-medium" onClick={() => reset("waiting")}>Hủy đo</button>}
            {stage !== "disconnected" && <button className="rounded-xl px-4 py-3 text-sm text-ink-500 hover:bg-canvas" onClick={() => reset("disconnected")}>{stage === "connecting" ? "Hủy kết nối" : "Ngắt kết nối"}</button>}
          </div>
        </section>

        <section className="space-y-4" aria-label="Kết quả phiên đo">
          <h2 className="text-base font-semibold">Kết quả phiên hiện tại</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <SensorCard icon={HeartPulse} label="Nhịp tim" value={stage === "result" ? reading?.heartRate ?? "—" : "—"} unit="BPM" />
            <SensorCard icon={Percent} label="SpO₂" value={stage === "result" ? reading?.spo2 ?? "—" : "—"} unit="%" accentClass="bg-accent-500/10 text-accent-600" />
          </div>
          <div className="rounded-xl bg-surface p-4 text-sm leading-relaxed text-ink-500 shadow-card">
            {stage === "result" && measuredAt ? <><p className="font-medium text-primary-700">Tín hiệu: đạt yêu cầu (mô phỏng)</p><p className="mt-1">Thời điểm: {measuredAt.toLocaleString("vi-VN")}</p><p className="mt-1">Thời lượng demo: {durationSeconds} giây · Đã cập nhật gợi ý demo</p></> : <p>{stage === "retry" ? "Tín hiệu không hợp lệ. Không hiển thị số đo để tránh nhầm với kết quả hợp lệ." : "Chưa có kết quả. Hoàn thành phiên đo để xem các chỉ số minh họa."}</p>}
          </div>
        </section>
      </div>
      <AIRecommendation />
      <Link to="/" className="inline-block text-sm font-semibold text-primary-700">Về dashboard xem chỉ số và gợi ý →</Link>
      <p className="text-sm leading-relaxed text-ink-500">Thiết bị trong luồng này chỉ cung cấp nhịp tim và SpO₂. Nhiệt độ môi trường, độ ẩm và bước chân cần nguồn dữ liệu riêng.</p>
    </div>
  );
}


