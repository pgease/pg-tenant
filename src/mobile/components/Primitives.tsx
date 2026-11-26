import React, { useEffect, useState } from 'react';
import { Building2, CheckCircle2, ChevronRight, Clock, Lock, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { sanitizeDisplayName } from '../../utils/formatters';

export type TenantIconTone = 'teal' | 'success' | 'danger';

export function MobileCard({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'ms-card p-4 w-full text-left transition-transform active:scale-[0.985] cursor-pointer',
          className,
        )}
      >
        {children}
      </button>
    );
  }
  return <div className={cn('ms-card p-4', className)}>{children}</div>;
}

export function IconTile({
  icon,
  tone = 'teal',
  size = 'md',
  className,
}: {
  icon: React.ReactNode;
  tone?: TenantIconTone;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeCls =
    size === 'sm' ? 'h-9 w-9 rounded-xl' : size === 'lg' ? 'h-12 w-12 rounded-2xl' : 'h-10 w-10 rounded-xl';
  const toneCls =
    tone === 'danger'
      ? 'bg-[var(--ms-error-bg)] text-[var(--ms-error)]'
      : tone === 'success'
        ? 'bg-[var(--ms-success-bg)] text-[var(--ms-success)]'
        : 'bg-[var(--ms-brand-50)] text-[var(--ms-brand-text)]';

  return (
    <div className={cn('flex items-center justify-center shrink-0', sizeCls, toneCls, className)}>
      {icon}
    </div>
  );
}

export type TenantStatusTone = 'pending' | 'paid' | 'overdue' | 'info';

export function StatusChip({
  label,
  tone = 'info',
  className,
}: {
  label: string;
  tone?: TenantStatusTone;
  className?: string;
}) {
  const styles: Record<TenantStatusTone, string> = {
    pending: 'bg-[var(--ms-pending-bg)] text-[var(--ms-pending-fg)] border-[var(--ms-pending-border)]',
    paid: 'bg-[var(--ms-success-bg)] text-[var(--ms-success)] border-[var(--ms-success-border)]',
    overdue: 'bg-[var(--ms-error-bg)] text-[var(--ms-error)] border-[var(--ms-error-border)]',
    info: 'bg-[var(--ms-brand-50)] text-[var(--ms-brand-text)] border-[var(--ms-brand-100)]',
  };
  const icon =
    tone === 'pending' ? (
      <Clock className="h-3 w-3 shrink-0" />
    ) : tone === 'paid' ? (
      <CheckCircle2 className="h-3 w-3 shrink-0" />
    ) : tone === 'overdue' ? (
      <XCircle className="h-3 w-3 shrink-0" />
    ) : null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold leading-none whitespace-nowrap',
        styles[tone],
        className,
      )}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
}

export function PgPhoto({
  src,
  alt,
  className,
  size = 'md',
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);

  const sizeCls = size === 'sm' ? 'h-12 w-12' : size === 'lg' ? 'h-20 w-20' : 'h-16 w-16';

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt || 'PG Property'}
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn(sizeCls, 'rounded-full object-cover border-2 border-[var(--ms-brand-100)] bg-[var(--ms-brand-50)] shrink-0', className)}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeCls,
        'rounded-full bg-[var(--ms-brand-50)] border-2 border-[var(--ms-brand-100)] text-[var(--ms-brand-text)] flex items-center justify-center shrink-0',
        className,
      )}
    >
      <Building2 className="h-7 w-7" />
    </div>
  );
}

export function TenantAvatar({
  src,
  name,
  size = 44,
  className,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);

  const clean = sanitizeDisplayName(name) || 'Resident';
  const initials = clean
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={clean}
        onError={() => setFailed(true)}
        style={{ width: size, height: size }}
        className={cn('rounded-full object-cover border border-[var(--ms-border)] bg-[var(--ms-brand-50)] shrink-0', className)}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        'rounded-full bg-[var(--ms-brand-600)] text-white font-semibold text-sm flex items-center justify-center shrink-0',
        className,
      )}
    >
      {initials || 'PG'}
    </div>
  );
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  rightText,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  rightText?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-0.5">
      <h2 className="text-[16px] font-semibold text-[var(--ms-ink)]">{title}</h2>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="text-[13px] font-semibold text-[var(--ms-brand-text)] min-h-[36px] px-1 cursor-pointer"
        >
          {actionLabel}
        </button>
      ) : rightText ? (
        <span className="text-[12px] text-[var(--ms-ink-3)]">{rightText}</span>
      ) : null}
    </div>
  );
}

export function ListRow({
  icon,
  tone = 'teal',
  title,
  subtitle,
  badge,
  locked,
  onClick,
}: {
  icon: React.ReactNode;
  tone?: TenantIconTone;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  locked?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left min-h-[60px] hover:bg-[var(--ms-page)]/60 active:bg-[var(--ms-page)] transition-colors cursor-pointer"
    >
      <IconTile icon={icon} tone={tone} size="md" />
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold text-[var(--ms-ink)] truncate">{title}</div>
        {subtitle && <div className="text-[12px] text-[var(--ms-ink-3)] truncate mt-0.5">{subtitle}</div>}
      </div>
      {badge}
      {locked ? (
        <Lock className="h-4 w-4 text-[var(--ms-ink-3)] shrink-0" />
      ) : (
        <ChevronRight className="h-4 w-4 text-[var(--ms-ink-3)] shrink-0" />
      )}
    </button>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-[var(--ms-border)]/70', className)} />;
}
