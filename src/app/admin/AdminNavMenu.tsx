'use client';

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Warehouse, Calendar, Settings, ArrowRight } from "lucide-react";

import { canManageEcosystems, canManageEvents } from "~/auth/helper";
import type { ApiUser } from "~/auth/typing";

type MenuItem = {
  text: string;
  path: string;
  childrenPrefix?: string;
};

interface AdminNavMenuProps {
  user: ApiUser | null;
}

// Icon mapping for menu items
const iconMap = {
  "Ecosystems": Warehouse,
  "Events": Calendar,
  "Managers": Settings,
};

function buildMenu(user: ApiUser | null): MenuItem[] {
  const menuItems: MenuItem[] = [];

  if (canManageEcosystems(user)) {
    menuItems.push({
      text: "Ecosystems",
      path: "/admin/ecosystems",
      childrenPrefix: "/admin/ecosystems",
    });
  }

  if (canManageEvents(user)) {
    menuItems.push({
      text: "Events",
      path: "/admin/events",
      childrenPrefix: "/admin/events",
    });
  }

  return menuItems;
}

function isMenuItemActive(pathname: string, item: MenuItem): boolean {
  return item.path === pathname || (!!item.childrenPrefix && pathname.startsWith(item.childrenPrefix));
}

function AdminNavMenu({ user }: AdminNavMenuProps) {
  const pathname = usePathname();
  const menuItems = buildMenu(user);

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="px-2">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Administration
        </h2>
      </div>

      {/* Navigation Items */}
      <nav className="space-y-2">
        {menuItems.map(item => {
          const isActive = isMenuItemActive(pathname, item);
          const IconComponent = iconMap[item.text as keyof typeof iconMap];

          return (
            <Link
              key={item.text}
              className={clsx(
                "group flex items-center justify-between px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                "hover:bg-white/80 dark:hover:bg-white/10 hover:shadow-subtle hover:scale-[1.02]",
                "border border-transparent hover:border-border dark:hover:border-border-dark",
                {
                  "bg-white dark:bg-white/10 text-primary shadow-card border-border dark:border-border-dark": isActive,
                  "text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary": !isActive,
                },
              )}
              href={item.path}
            >
              <div className="flex items-center gap-3">
                <div className={clsx(
                  "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
                  {
                    "bg-primary/10 text-primary": isActive,
                    "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-primary/10 group-hover:text-primary": !isActive,
                  },
                )}>
                  {IconComponent && <IconComponent size={16} />}
                </div>
                <span className="font-medium">{item.text}</span>
              </div>

              <ArrowRight
                size={14}
                className={clsx(
                  "transition-all duration-200 opacity-0 group-hover:opacity-100 group-hover:translate-x-1",
                  {
                    "opacity-100 text-primary": isActive,
                    "text-gray-400": !isActive,
                  },
                )}
              />
            </Link>
          );
        })}
      </nav>

      {/* Navigation Footer */}
      <div className="px-2 pt-4 border-t border-border dark:border-border-dark">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Admin Panel
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Manage your Web3Insight
        </p>
      </div>
    </div>
  );
}

export default AdminNavMenu;
