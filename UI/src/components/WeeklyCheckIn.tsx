import { useState, type FormEvent } from "react";
import { CalendarCheck } from "lucide-react";
import { useHealthSession } from "@/context/HealthSession";
import { useDeadline } from "@/hooks/useDeadline";
import { nextCheckIn } from "@/lib/healthProfile";

export default function WeeklyCheckIn() {
  const { data, saveWeight } = useHealthSession();
  const next = data ? nextCheckIn(data.entries) : null;
  const due = useDeadline(next?.getTime() ?? null);
  const [weight, setWeight] = useState("");
  const [message, setMessage] = useState("");

  if (!data || !next) return null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saveWeight(Number(weight))) {
      setMessage("Đã cập nhật cân nặng tuần này. BMI và lịch sử đã được cập nhật.");
      setWeight("");
    } else setMessage("Chưa thể lưu. Hãy kiểm tra cân nặng và thời điểm cập nhật.");
  }

  return (
    <section
      className="rounded-xl2 border border-ink-900/5 bg-white p-5 shadow-card"
      aria-label="Cập nhật cân nặng hằng tuần"
    >
      <div className="flex items-start gap-3">
        <CalendarCheck className="mt-0.5 shrink-0 text-primary-700" size={22} />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-ink-900">
            {due ? "Đến lịch cân tuần này rồi" : "Lịch cập nhật cân nặng"}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">
            {due
              ? "Bạn nặng bao nhiêu kg hôm nay? Nhập một lần để theo dõi thay đổi trong tuần."
              : `Cân nặng gần nhất: ${data.profile.weightKg} kg. Lần cập nhật tiếp theo: ${next.toLocaleDateString("vi-VN")}.`}
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Ứng dụng nhắc sau mỗi 7 ngày khi bạn truy cập, không cần nhập hằng ngày.
          </p>
          {due && (
            <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-ink-700">
                Cân nặng hiện tại (kg)
                <input
                  autoComplete="off"
                  type="number"
                  min="20"
                  max="300"
                  step="0.1"
                  required
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                  className="w-44 rounded-xl border border-ink-900/10 bg-white px-3 py-2.5"
                  placeholder="Ví dụ: 66.5"
                />
              </label>
              <button className="rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600">
                Lưu cân nặng tuần này
              </button>
            </form>
          )}
          <p role="status" className="mt-2 text-sm text-primary-700">
            {message}
          </p>
        </div>
      </div>
    </section>
  );
}
