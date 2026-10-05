import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import RouteError from "@/components/RouteError";
import AppLayout from "@/components/AppLayout";
import { HealthSessionProvider } from "@/context/HealthSession";
import { MeasurementProvider } from "@/context/Measurement";

// useMatches() (used by AppLayout to read each route's title/subtitle) only
// works with a "data router", so routes must be created with
// createBrowserRouter rather than <BrowserRouter>/<Routes>/<Route>.
const router = createBrowserRouter([
  {
    path: "/auth",
    errorElement: <RouteError />,
    lazy: async () => ({ Component: (await import("@/pages/Auth")).default }),
  },
  { path: "/login", element: <Navigate to="/auth" replace /> },
  {
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      {
        path: "/",
        lazy: async () => ({ Component: (await import("@/pages/Dashboard")).default }),
        handle: {
          title: "Tổng quan sức khỏe",
          subtitle: "Theo dõi những thay đổi nhỏ, chăm sóc bản thân tốt hơn.",
        },
      },
      {
        path: "/health-tracking",
        lazy: async () => ({ Component: (await import("@/pages/HealthTracking")).default }),
        handle: { title: "Theo dõi sức khỏe", subtitle: "Theo dõi cân nặng và BMI theo thời gian" },
      },
      {
        path: "/sensors",
        lazy: async () => ({ Component: (await import("@/pages/Sensors")).default }),
        handle: { title: "Thiết bị cảm biến", subtitle: "Trạng thái thiết bị và dữ liệu IoT" },
      },
      {
        path: "/weather-ai",
        lazy: async () => ({ Component: (await import("@/pages/WeatherAI")).default }),
        handle: { title: "Thời tiết & gợi ý", subtitle: "Thời tiết môi trường và khuyến nghị AI" },
      },
      {
        path: "/profile",
        lazy: async () => ({ Component: (await import("@/pages/Profile")).default }),
        handle: { title: "Hồ sơ cá nhân", subtitle: "Thông tin cá nhân và chỉ số cơ thể" },
      },
    ],
  },
]);

export default function App() {
  return (
    <HealthSessionProvider>
      <MeasurementProvider>
        <RouterProvider
          router={router}
          fallbackElement={
            <p role="status" className="p-8 text-sm text-ink-500">
              Đang tải giao diện…
            </p>
          }
        />
      </MeasurementProvider>
    </HealthSessionProvider>
  );
}
