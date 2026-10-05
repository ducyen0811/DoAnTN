export default function RouteError() {
  return (
    <main className="mx-auto max-w-lg space-y-4 px-6 py-16">
      <h1 className="text-xl font-semibold">Chưa thể tải trang</h1>
      <p className="text-sm text-ink-500">Vui lòng kiểm tra kết nối và thử tải lại trang.</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-xl bg-primary-700 px-4 py-2 text-sm font-semibold text-white"
      >
        Tải lại trang
      </button>
      <a href="/" className="ml-4 text-sm text-primary-700">
        Về tổng quan
      </a>
    </main>
  );
}
