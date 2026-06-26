interface LoaderProps {
  label?: string;
}

export const FullScreenLoader = ({ label }: LoaderProps) => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
    <span className="loading loading-spinner loading-lg text-primary" />
    {label ? <p className="text-sm text-base-content/60">{label}</p> : null}
  </div>
);

export const InlineLoader = ({ label }: LoaderProps) => (
  <div className="flex items-center justify-center gap-2 py-8">
    <span className="loading loading-spinner loading-md text-primary" />
    {label ? <span className="text-sm text-base-content/60">{label}</span> : null}
  </div>
);
