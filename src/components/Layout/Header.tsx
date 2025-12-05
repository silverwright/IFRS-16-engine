import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FileText,
  Calculator,
  BookOpen,
  GraduationCap,
  BarChart3,
  Bell,
  User,
  ChevronDown,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const navigation = [
  { name: "Home", href: "/" },
  {
    name: "Modules",
    children: [
      { name: "Contract Initiation", href: "/contract", icon: FileText },
      { name: "Calculations", href: "/calculations", icon: Calculator },
      {
        name: "Disclosure & Journal Entries",
        href: "/disclosure-journals",
        icon: FileText,
      },
      { name: "Methodology", href: "/methodology", icon: BookOpen },
    ],
  },
  { name: "Learn IFRS 16", href: "/education" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Reports", href: "/reports" },
];

export function Header() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [openDropdown, setOpenDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-6 py-4 border-b border-slate-300 dark:border-slate-700">
      <div className="flex items-center justify-between">
        {/* Logo + title */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              IFRS 16 Leases
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Professional Lease Management System
            </p>
          </div>
        </div>

        {/* Navigation + Notifications + User */}
        <div className="flex items-center gap-6">
          {/* Navigation links */}
          <nav className="flex items-center gap-4 relative">
            {navigation.map((item) => {
              if (item.children) {
                // Dropdown menu
                return (
                  <div key={item.name} className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setOpenDropdown(!openDropdown)}
                      className={`
                        flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium transition-colors
                        ${
                          openDropdown
                            ? "text-emerald-500 dark:text-emerald-400 bg-slate-200 dark:bg-slate-700"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                        }
                      `}
                    >
                      {item.name}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          openDropdown ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </button>

                    {openDropdown && (
                      <div className="absolute top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-lg z-50">
                        {item.children.map((child) => {
                          const isActive = location.pathname === child.href;
                          return (
                            <Link
                              key={child.name}
                              to={child.href}
                              className={`
                                flex items-center gap-2 px-4 py-2 text-sm transition-colors
                                ${
                                  isActive
                                    ? "text-emerald-500 dark:text-emerald-400 bg-slate-100 dark:bg-slate-700"
                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                                }
                              `}
                              onClick={() => setOpenDropdown(false)}
                            >
                              {child.icon && <child.icon className="w-4 h-4" />}
                              {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    px-2 py-1 rounded-md text-sm font-medium transition-colors
                    ${
                      isActive
                        ? "text-emerald-500 dark:text-emerald-400 bg-slate-200 dark:bg-slate-700"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                    }
                  `}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Notification */}
          <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Toggle dark/light mode"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            ) : (
              <Sun className="w-5 h-5 text-yellow-500 dark:text-slate-300" />
            )}
          </button>

          {/* User */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg">
            <User className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              Admin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
