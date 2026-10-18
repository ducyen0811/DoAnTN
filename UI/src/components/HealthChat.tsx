import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageCircle, Send, RotateCcw } from "lucide-react";
import { useMeasurement } from "@/context/Measurement";
import { useHealthSession } from "@/context/HealthSession";
import { healthGoals } from "@/lib/healthProfile";
import { mockWeather } from "@/data/mockHealthData";

type Message = { role: "user" | "assistant"; content: string };
const questions = ["Giải thích kết quả đo của tôi", "Vì sao gợi ý tập trong nhà?", "Tôi nên theo dõi gì theo mục tiêu của mình?"];

export default function HealthChat() {
  const { reading, pending, invalid, stale } = useMeasurement();
  const { data } = useHealthSession();
  const [mode, setMode] = useState<"health" | "calories">("health");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    const conversation = end.current?.parentElement;
    if (conversation) conversation.scrollTop = conversation.scrollHeight;
  }, [messages, busy]);

  async function send(question: string) {
    const content = question.trim();
    if (!content || content.length > 2000 || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 100000);
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next); setDraft(""); setError(""); setBusy(true);
    try {
      const profile = data?.profile;
      const response = await fetch("/chat-api/messages", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ mode, messages: next.slice(-19), context: {
          profile: profile ? { age: profile.age, heightCm: profile.heightCm, weightKg: profile.weightKg,
            healthGoal: profile.healthGoal, activityLevel: profile.activityLevel } : null,
          measurement: reading, pending, invalid, stale,
          weather: { temperatureC: mockWeather.temperatureC, uvIndex: mockWeather.uvIndex,
            humidityPercent: mockWeather.humidityPercent, aqi: mockWeather.aqi },
        } }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof result?.detail === "string" ? result.detail : "Không kết nối được dịch vụ chat. Kiểm tra dịch vụ AI cục bộ và thử lại.");
      if (typeof result?.reply !== "string" || !result.reply.trim()) throw new Error("AI chưa trả lời được. Vui lòng thử lại.");
      setMessages([...next, { role: "assistant", content: result.reply }]);
    } catch (reason) {
      if (request.current !== controller) return;
      setMessages(messages); setDraft(content);
      setError(controller.signal.aborted ? "Chờ AI quá lâu. Câu hỏi vẫn được giữ để bạn gửi lại." : reason instanceof Error ? reason.message : "Không gửi được câu hỏi.");
    } finally {
      window.clearTimeout(timeout);
      if (request.current === controller) { request.current = null; setBusy(false); }
    }
  }
  function submit(event: FormEvent) { event.preventDefault(); void send(draft); }

  return <section className="mt-5 border-t border-ink-900/10 pt-5" aria-label="Trò chuyện với trợ lý AI">
    <div className="flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 font-semibold"><MessageCircle size={19} /> Hỏi thêm với trợ lý AI</h3>
      {messages.length > 0 && <button type="button" disabled={busy} onClick={() => { setMessages([]); setError(""); }} className="flex items-center gap-1 text-xs text-ink-500 disabled:opacity-50"><RotateCcw size={14} /> Cuộc trò chuyện mới</button>}
    </div>
    <p className="mt-2 text-xs leading-relaxed text-ink-500">AI cục bộ · Số đo và thời tiết mô phỏng · {data ? `Mục tiêu: ${healthGoals[data.profile.healthGoal]}` : "Chưa có hồ sơ"}. Hội thoại giữ trong trang này; mỗi lượt dùng tối đa 9 lượt hỏi đáp gần nhất.</p>
    <div className="mt-3 flex gap-2">{(["health", "calories"] as const).map(value => <button key={value} type="button" disabled={busy} aria-pressed={mode === value} onClick={() => { setMode(value); setMessages([]); setError(""); }} className={`rounded-xl border px-3 py-2 text-sm ${mode === value ? "bg-primary-700 text-white" : "bg-white"}`}>{value === "health" ? "Sức khỏe" : "Ước tính calo"}</button>)}</div>
    {mode === "calories" && <p className="mt-2 text-sm text-ink-700">Gửi tên món, lượng ăn (gram hoặc khẩu phần), cách nấu và dầu/sốt. AI ước tính calo và gợi ý theo mục tiêu của bạn.</p>}
    <div role="log" aria-label="Lịch sử trò chuyện" aria-live="polite" aria-relevant="additions" className="mt-4 max-h-96 space-y-3 overflow-y-auto rounded-xl bg-white/70 p-3">
      {messages.length === 0 && <p className="text-sm leading-relaxed text-ink-700">Bạn có thể hỏi lý do của gợi ý, giải thích chỉ số hoặc bổ sung bối cảnh. Trợ lý ưu tiên trả lời trực tiếp, chỉ hỏi lại khi thật sự cần thiết.</p>}
      {messages.map((message, index) => <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[90%] rounded-xl px-4 py-3 text-sm ${message.role === "user" ? "bg-primary-700 text-white" : "border border-ink-900/10 bg-white text-ink-700"}`}>
          <p className="mb-1 text-xs font-semibold">{message.role === "user" ? "Bạn" : "Trợ lý AI"}</p>
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        </div>
      </div>)}
      {busy && <p role="status" className="text-sm text-ink-500">AI đang trả lời…</p>}
      <div ref={end} />
    </div>
    {messages.length === 0 && <div className="mt-3 flex flex-wrap gap-2">{(mode === "calories" ? ["Tôi ăn 150g món có nhãn 200 kcal/100g, hãy tính calo theo mục tiêu của tôi", "Một tô phở bò cần thông tin gì để ước tính calo?"] : questions).map(question => <button type="button" key={question} disabled={busy} onClick={() => void send(question)} className="rounded-xl border border-primary-100 bg-white px-3 py-2 text-xs text-primary-700 disabled:opacity-50">{question}</button>)}</div>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    <form onSubmit={submit} className="mt-3 flex items-end gap-2">
      <div className="flex-1"><label htmlFor="health-chat-question" className="sr-only">Câu hỏi cho trợ lý AI</label>
        <textarea id="health-chat-question" value={draft} onChange={event => setDraft(event.target.value)} disabled={busy} maxLength={2000} rows={2} placeholder="Nhập câu hỏi hoặc thông tin bạn muốn bổ sung…" className="w-full resize-y rounded-xl border border-ink-900/10 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700 disabled:opacity-60" />
      </div>
      <button type="submit" disabled={busy || !draft.trim()} className="mb-1 flex items-center gap-2 rounded-xl bg-primary-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><Send size={16} /><span>Gửi</span></button>
    </form>
  </section>;
}
