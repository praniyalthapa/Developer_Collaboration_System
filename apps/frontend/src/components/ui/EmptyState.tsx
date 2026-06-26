import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

const DefaultIcon = (
  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const EmptyState = ({
  title,
  description,
  action,
  icon,
}: EmptyStateProps) => (
  <div className="surface mx-auto flex min-h-[50vh] max-w-lg animate-fade-up flex-col items-center justify-center gap-4 p-10 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      {icon ?? DefaultIcon}
    </div>
    <div>
      <h2 className="text-xl font-bold">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm text-base-content/60">{description}</p>
      ) : null}
    </div>
    {action}
  </div>
);
