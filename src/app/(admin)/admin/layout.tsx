//src/app/(admin)/admin/layout.tsx
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-dvh">{children}</div>;
}