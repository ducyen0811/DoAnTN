import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useHealthSession } from "./HealthSession";
import { useDeadline } from "@/hooks/useDeadline";

export type Scenario = "standard" | "high" | "oxygen";
export type Measurement = {
  scenario: Scenario;
  heartRate: number;
  spo2: number;
  measuredAt: number;
  context: "unknown" | "resting" | "exercise";
};
interface MeasurementContext {
  reading: Measurement | null;
  pending: boolean;
  invalid: boolean;
  stale: boolean;
  begin: () => void;
  finish: (scenario: Scenario, valid: boolean) => void;
  cancel: () => void;
  setContext: (value: Measurement["context"]) => void;
}
const Context = createContext<MeasurementContext | null>(null);
const FRESHNESS_MS = 15 * 60 * 1000;

// Demo values, not clinical thresholds. Freshness is an application setting.
export function MeasurementProvider({ children }: { children: ReactNode }) {
  const { signedIn } = useHealthSession();
  const [reading, setReading] = useState<Measurement | null>(null);
  const [pending, setPending] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const stale = useDeadline(reading ? reading.measuredAt + FRESHNESS_MS : null);
  useEffect(() => {
    if (!signedIn) {
      setReading(null);
      setPending(false);
      setInvalid(false);
    }
  }, [signedIn]);
  const begin = useCallback(() => {
    setReading(null);
    setInvalid(false);
    setPending(true);
  }, []);
  const finish = useCallback((scenario: Scenario, valid: boolean) => {
    setPending(false);
    setInvalid(!valid);
    setReading(
      valid
        ? {
            scenario,
            heartRate: scenario === "high" ? 115 : 76,
            spo2: scenario === "oxygen" ? 92 : 98,
            measuredAt: Date.now(),
            context: "unknown",
          }
        : null,
    );
  }, []);
  const cancel = useCallback(() => setPending(false), []);
  const setContext = useCallback((context: Measurement["context"]) => {
    setReading((previous) =>
      previous && previous.context !== context ? { ...previous, context } : previous,
    );
  }, []);
  const value = useMemo(
    () => ({ reading, pending, invalid, stale, begin, finish, cancel, setContext }),
    [reading, pending, invalid, stale, begin, finish, cancel, setContext],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useMeasurement() {
  const value = useContext(Context);
  if (!value) throw new Error("MeasurementProvider required");
  return value;
}
