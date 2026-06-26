import { Avatar } from "./Avatar";
import { DEMO_ACCOUNTS } from "../lib/demoAccounts";

interface DemoAccountsProps {
  onSelect: (email: string, password: string) => void;
  disabled?: boolean;
}

export const DemoAccounts = ({ onSelect, disabled }: DemoAccountsProps) => (
  <div className="surface p-6">
    <h2 className="text-lg font-semibold">Demo accounts</h2>
    <p className="mt-1 text-sm text-base-content/60">
      Click an account to sign in instantly.
    </p>

    <ul className="mt-4 space-y-2">
      {DEMO_ACCOUNTS.map((account) => {
        const [first, ...rest] = account.name.split(" ");
        return (
          <li key={account.email}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(account.email, account.password)}
              className="flex w-full items-center gap-3 rounded-xl border border-base-300 p-3 text-left transition-colors hover:border-primary hover:bg-base-200 disabled:opacity-60"
            >
              <Avatar
                firstName={first}
                lastName={rest.join(" ")}
                photoUrl={account.photoUrl}
                size="w-11 h-11"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{account.name}</span>
                  {account.role === "admin" ? (
                    <span className="badge badge-primary badge-xs">admin</span>
                  ) : null}
                </div>
                <div className="truncate text-xs text-base-content/60">
                  {account.tagline}
                </div>
              </div>
              <span className="text-xs font-medium text-primary">Use</span>
            </button>
          </li>
        );
      })}
    </ul>

    <p className="mt-4 text-xs text-base-content/50">
      Passwords: Admin@12345 (admin), Demo@12345 (users).
    </p>
  </div>
);
