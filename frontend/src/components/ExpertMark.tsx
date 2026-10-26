import { BookOpen, FileText, Network, Settings2, ShieldCheck, Users } from 'lucide-react';
import type { Expert } from '@/types';
const domains = {
  'AI & Data': { icon: ShieldCheck, style: 'bg-info-soft text-info' },
  Security: { icon: Settings2, style: 'bg-violet-soft text-violet' },
  Compliance: { icon: FileText, style: 'bg-success-soft text-success' },
  Operations: { icon: Network, style: 'bg-orange-soft text-orange' },
  Synthesis: { icon: BookOpen, style: 'bg-info-soft text-n4' },
};
export function ExpertMark({
  expert,
  small = false,
}: Readonly<{ expert: Pick<Expert, 'domain'>; small?: boolean }>) {
  const config = domains[expert.domain as keyof typeof domains] || {
      icon: Users,
      style: 'bg-info-soft text-info',
    },
    Icon = config.icon;
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-lg ${small ? 'h-9 w-9' : 'h-11 w-11'} ${config.style}`}
    >
      <Icon size={small ? 19 : 23} strokeWidth={1.65} aria-hidden="true" />
    </span>
  );
}
