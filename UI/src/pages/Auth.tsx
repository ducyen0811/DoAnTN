import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Activity, ArrowLeft, ArrowRight, CalendarCheck, Check, Eye, EyeOff, HeartPulse } from "lucide-react";
import { useHealthSession } from "@/context/HealthSession";
import { healthGoals } from "@/lib/healthProfile";
import type { ActivityLevel, Gender } from "@/types/health";

const inputClass = "w-full rounded-xl border border-ink-900/10 bg-white px-3.5 py-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-primary-500";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-ink-700";

export default function Auth() {
  const navigate = useNavigate();
  const { signedIn, signIn, completeProfile } = useHealthSession();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<keyof typeof healthGoals>("maintain");

  if (signedIn) return <Navigate to="/" replace />;

  function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (mode === "register" && password !== confirmPassword) {
      setError("Mật khẩu xác nhận chưa khớp.");
      return;
    }
    setPassword("");
    setConfirmPassword("");
    if (mode === "login" && signIn(email)) navigate("/", { replace: true });
    else setStep(2);
  }

  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fullName.trim()) { setError("Vui lòng nhập họ và tên."); return; }
    completeProfile({
      id: "local_demo", fullName: fullName.trim(), email: email.trim(),
      age: Number(age), gender, heightCm: Number(height), weightKg: Number(weight),
      activityLevel: activity, healthGoal: goal,
    });
    navigate("/", { replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary-700 p-10 text-white lg:flex xl:p-16">
        <div aria-hidden="true" className="absolute -right-32 top-1/4 h-96 w-96 rounded-full border-[48px] border-white/5" />
        <div className="relative flex items-center gap-3 text-xl font-semibold"><Activity size={28} />HealthAI</div>
        <div className="relative my-12 max-w-md">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs">Sức khỏe của bạn, bắt đầu từ hôm nay</span>
          <h2 className="mt-7 text-4xl font-semibold leading-tight tracking-tight">Hiểu cơ thể.<br />Chăm sóc tốt hơn.</h2>
          <p className="mt-5 leading-relaxed text-primary-50">Một nơi để theo dõi sức khỏe, kết nối thiết bị và nhận những gợi ý phù hợp với bạn.</p>
          <div className="mt-9 space-y-5">
            {[{ icon: HeartPulse, title: "Hồ sơ riêng cho bạn", detail: "Thiết lập một lần để bắt đầu theo dõi." }, { icon: CalendarCheck, title: "Một lần cân mỗi tuần", detail: "Theo dõi tiến trình, không cần nhập mỗi ngày." }].map(({ icon: Icon, title, detail }) => <div key={title} className="flex gap-3"><Icon size={22} className="mt-1 shrink-0 text-primary-100" /><div><p className="font-medium">{title}</p><p className="mt-1 text-sm text-primary-50">{detail}</p></div></div>)}
          </div>
        </div>
        <p className="relative text-xs text-primary-100">HealthAI · Chăm sóc sức khỏe cá nhân thông minh</p>
      </aside>

      <main className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-lg">
          <div className="mb-8 flex items-center gap-2 text-lg font-semibold text-primary-700 lg:hidden"><Activity />HealthAI</div>
          <ol aria-label="Tiến trình thiết lập" className="mb-8 flex items-center gap-3 text-xs font-medium sm:text-sm">
            <li className="flex items-center gap-2 text-primary-700"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-700 text-white">{step === 2 ? <Check size={16} /> : "1"}</span>Tài khoản</li>
            <li aria-hidden="true" className="h-px flex-1 bg-ink-900/10" />
            <li className={`flex items-center gap-2 ${step === 2 ? "text-primary-700" : "text-ink-500"}`}><span className={`flex h-7 w-7 items-center justify-center rounded-full ${step === 2 ? "bg-primary-700 text-white" : "bg-ink-900/5"}`}>2</span>Hồ sơ sức khỏe</li>
          </ol>

          <h1 className="text-3xl font-semibold tracking-tight">{step === 2 ? "Làm quen một chút nhé" : mode === "login" ? "Chào mừng trở lại" : "Bắt đầu hành trình của bạn"}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">{step === 2 ? "Nhập thông tin ban đầu để cá nhân hóa trang theo dõi của bạn." : "Theo dõi sức khỏe và những thay đổi nhỏ mỗi tuần."}</p>
          <p className="mt-4 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-xs leading-relaxed text-primary-700">Bản trải nghiệm: đăng nhập chưa xác thực, mật khẩu không được lưu. Hồ sơ chỉ được lưu trong tab trình duyệt này.</p>

          {step === 1 ? <>
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-ink-900/5 p-1">
              {(["login", "register"] as const).map(value => <button key={value} type="button" aria-pressed={mode === value} onClick={() => { setMode(value); setError(""); }} className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${mode === value ? "bg-white text-primary-700 shadow-sm" : "text-ink-500"}`}>{value === "login" ? "Đăng nhập" : "Đăng ký"}</button>)}
            </div>
            <form onSubmit={submitCredentials} className="mt-6 space-y-4">
              <label className={labelClass}>Email<input className={inputClass} type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="ban@vidu.com" /></label>
              <label className={labelClass}>Mật khẩu
                <span className="relative"><input className={`${inputClass} pr-12`} type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={event => setPassword(event.target.value)} placeholder="Ít nhất 8 ký tự" /><button type="button" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-ink-500">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>
              </label>
              {mode === "register" && <label className={labelClass}>Nhập lại mật khẩu<input className={inputClass} type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Nhập lại mật khẩu của bạn" /></label>}
              {error && <p role="alert" className="text-sm text-danger-600">{error}</p>}
              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-600">{mode === "login" ? "Tiếp tục đăng nhập" : "Tiếp tục đăng ký"}<ArrowRight size={17} /></button>
              <p className="text-center text-xs leading-relaxed text-ink-500">Lần đầu trải nghiệm? Bạn sẽ được hướng dẫn thiết lập hồ sơ ở bước tiếp theo.</p>
            </form>
          </> : <form onSubmit={submitProfile} className="mt-6 space-y-4">
            <label className={labelClass}>Họ và tên<input className={inputClass} autoComplete="name" required maxLength={100} value={fullName} onChange={event => setFullName(event.target.value)} placeholder="Tên của bạn" /></label>
            <div className="grid grid-cols-2 gap-4">
              <label className={labelClass}>Tuổi<input className={inputClass} type="number" required min={18} max={120} value={age} onChange={event => setAge(event.target.value)} placeholder="Ví dụ: 24" /></label>
              <label className={labelClass}>Giới tính<select className={inputClass} value={gender} onChange={event => setGender(event.target.value as Gender)}><option value="male">Nam</option><option value="female">Nữ</option><option value="other">Khác</option></select></label>
              <label className={labelClass}>Chiều cao (cm)<input className={inputClass} type="number" required min={100} max={250} step="0.1" value={height} onChange={event => setHeight(event.target.value)} placeholder="Ví dụ: 172" /></label>
              <label className={labelClass}>Cân nặng (kg)<input className={inputClass} type="number" required min={20} max={300} step="0.1" value={weight} onChange={event => setWeight(event.target.value)} placeholder="Ví dụ: 66.5" /></label>
            </div>
            <p className="text-xs text-ink-500">Phiên bản hiện tại dành cho người từ 18 tuổi. Cân nặng này là mốc đầu tiên; lần cập nhật tiếp theo sau 7 ngày.</p>
            <label className={labelClass}>Mức độ vận động<select className={inputClass} value={activity} onChange={event => setActivity(event.target.value as ActivityLevel)}><option value="sedentary">Ít vận động</option><option value="light">Vận động nhẹ</option><option value="moderate">Vận động vừa</option><option value="active">Năng động</option><option value="very_active">Rất năng động</option></select></label>
            <label className={labelClass}>Mục tiêu sức khỏe<select className={inputClass} value={goal} onChange={event => setGoal(event.target.value as keyof typeof healthGoals)}>{Object.entries(healthGoals).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            {error && <p role="alert" className="text-sm text-danger-600">{error}</p>}
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-600">Hoàn tất và vào trang tổng quan<ArrowRight size={17} /></button>
            <button type="button" onClick={() => { setStep(1); setError(""); }} className="flex items-center gap-2 text-sm text-ink-500 hover:text-primary-700"><ArrowLeft size={16} />Quay lại</button>
          </form>}
        </div>
      </main>
    </div>
  );
}
