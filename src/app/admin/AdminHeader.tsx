'use client';

import { Chip } from "@nextui-org/react";
import Navbar from "$/navbar";
import { getRoleName, getRoleColor } from "@/utils/role";

interface AdminHeaderProps {
  user: Record<string, unknown>;
  effectiveRole: string | null;
}

export default function AdminHeader({ user, effectiveRole }: AdminHeaderProps) {
  return (
    <header className="flex-shrink-0 glass-morphism border-b border-border dark:border-border-dark">
      <Navbar
        user={user}
        extra={
          <div className="flex items-center gap-3 border-l border-border dark:border-border-dark pl-4">
            <span className="text-sm font-medium text-foreground dark:text-foreground-dark">
              Admin Panel
            </span>
            {effectiveRole && (
              <Chip
                size="sm"
                color={getRoleColor(effectiveRole)}
                variant="flat"
                className="text-xs font-medium"
              >
                {getRoleName(effectiveRole)}
              </Chip>
            )}
          </div>
        }
      />
    </header>
  );
}
