import type React from 'react';

export function classNames(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(' ');
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'soft';
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button className={`btn ${variant}`} disabled={disabled} onClick={onClick} type={type}>
      {children}
    </button>
  );
}

export function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder} />
    </label>
  );
}

export function Metric({ label, value, unit }: { label: string; value: React.ReactNode; unit?: string }) {
  return <div className="metric"><strong>{value}</strong><span>{label}</span><small>{unit}</small></div>;
}

export function ActionCard({ title, copy, onClick }: { title: string; copy: string; onClick: () => void }) {
  return <button className="action-card" onClick={onClick}><strong>{title}</strong><span>{copy}</span></button>;
}

export function IconActionCard({
  title,
  copy,
  onClick,
  icon,
}: {
  title: string;
  copy: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button className="action-card" onClick={onClick}>
      <span className="action-icon">{icon}</span>
      <strong>{title}</strong>
      <small>{copy}</small>
    </button>
  );
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return <label className="toggle"><span>{label}</span><input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} /></label>;
}
