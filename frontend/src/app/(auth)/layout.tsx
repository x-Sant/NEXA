export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0e1a]">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-primary/20 blur-[100px] animate-pulse" />
        <div
          className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-accent/15 blur-[120px] animate-pulse"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute -bottom-40 left-1/3 w-72 h-72 rounded-full bg-[#10b981]/10 blur-[100px] animate-pulse"
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
}
