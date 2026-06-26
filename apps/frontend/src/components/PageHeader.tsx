import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";

interface PageHeaderProps {
  icon?: IconName;
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
}

export const PageHeader = ({
  icon,
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) => (
  <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="flex items-start gap-4">
      {icon ? (
        <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary sm:flex">
          <Icon name={icon} className="h-6 w-6" />
        </div>
      ) : null}
      <div>
        {eyebrow ? (
          <p className="mb-1.5 font-mono text-xs uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-base-content/60">
            {description}
          </p>
        ) : null}
      </div>
    </div>
    {actions ? (
      <div className="flex shrink-0 items-center gap-2">{actions}</div>
    ) : null}
  </div>
);
