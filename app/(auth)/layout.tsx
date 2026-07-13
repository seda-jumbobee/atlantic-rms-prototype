export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-svh place-items-center overflow-hidden bg-gradient-to-br from-slate-50 to-sky-50 p-4">
      {/* faint dotted-globe / lane backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(100 116 139 / 0.35) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
