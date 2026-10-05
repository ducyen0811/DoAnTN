import { useEffect, useState } from "react";

// Wake at the deadline instead of re-rendering the app on a permanent interval.
export function useDeadline(deadline: number | null): boolean {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (deadline === null) return;
    let timer: number | undefined;
    const update = () => {
      window.clearTimeout(timer);
      const current = Date.now();
      setNow(current);
      const remaining = deadline - current;
      if (remaining > 0) timer = window.setTimeout(update, Math.min(remaining, 2147483647));
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") update();
    };
    update();
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [deadline]);
  return deadline !== null && now >= deadline;
}
