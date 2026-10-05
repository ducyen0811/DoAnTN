import { User, Cake, VenetianMask, Ruler, Weight, Zap, Target } from "lucide-react";
import { useHealthSession } from "@/context/HealthSession";
import { calculateBmi, healthGoals } from "@/lib/healthProfile";
import BMICard from "@/components/BMICard";
import WeeklyCheckIn from "@/components/WeeklyCheckIn";
import type { ActivityLevel, Gender } from "@/types/health";

const genderLabel: Record<Gender, string> = { male: "Nam", female: "Nữ", other: "Khác" };
const activityLabel: Record<ActivityLevel, string> = {
  sedentary: "Ít vận động", light: "Vận động nhẹ", moderate: "Vận động vừa",
  active: "Năng động", very_active: "Rất năng động",
};

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return <div className="flex items-center gap-4 py-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-canvas text-ink-500"><Icon size={17} /></div>
    <div><p className="text-xs text-ink-500">{label}</p><p className="text-sm font-medium text-ink-900">{value}</p></div>
  </div>;
}

export default function Profile() {
  const { data } = useHealthSession();
  if (!data) return null;
  const { profile } = data;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        <section className="rounded-xl2 bg-surface p-6 shadow-card lg:col-span-2">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-700 text-xl font-semibold text-white">{profile.fullName.split(/\s+/).slice(-2).map(part => part[0]).join("")}</div>
            <div className="min-w-0"><h2 className="break-words text-lg font-semibold">{profile.fullName}</h2><p className="break-all text-sm text-ink-500">{profile.email}</p></div>
          </div>
          <div className="mt-4 divide-y divide-ink-900/5">
            <InfoRow icon={Cake} label="Tuổi" value={`${profile.age}`} />
            <InfoRow icon={VenetianMask} label="Giới tính" value={genderLabel[profile.gender]} />
            <InfoRow icon={Ruler} label="Chiều cao" value={`${profile.heightCm} cm`} />
            <InfoRow icon={Weight} label="Cân nặng gần nhất" value={`${profile.weightKg} kg`} />
            <InfoRow icon={Zap} label="Mức độ vận động" value={activityLabel[profile.activityLevel]} />
            <InfoRow icon={Target} label="Mục tiêu sức khỏe" value={healthGoals[profile.healthGoal]} />
          </div>
        </section>
        <div className="space-y-4">
          <BMICard bmi={calculateBmi(profile.weightKg, profile.heightCm)} />
          <p className="px-2 text-sm leading-relaxed text-ink-500">BMI được tính từ chiều cao và lần cập nhật cân nặng gần nhất của bạn.</p>
        </div>
      </div>
      <WeeklyCheckIn />
    </div>
  );
}
