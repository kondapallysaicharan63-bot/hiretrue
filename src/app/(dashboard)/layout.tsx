import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, FileText, LayoutDashboard, User } from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect('/signin');

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-card flex flex-col gap-1 p-4 shrink-0">
        <Link href="/jobs" className="flex items-center gap-2 text-sm font-semibold mb-6 px-2">
          <Briefcase className="h-5 w-5 text-primary" />
          HireTrue
        </Link>
        <NavLink href="/jobs" icon={<LayoutDashboard className="h-4 w-4" />} label="Job Search" />
        <NavLink href="/resume" icon={<FileText className="h-4 w-4" />} label="My Resume" />
        <NavLink href="/tracker" icon={<Briefcase className="h-4 w-4" />} label="Tracker" />
        <NavLink href="/profile" icon={<User className="h-4 w-4" />} label="Profile" />
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}
