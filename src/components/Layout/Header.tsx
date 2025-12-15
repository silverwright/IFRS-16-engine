import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  LogOut,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

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
  { name: "Approvals", href: "/approvals", requiredRoles: ['approver', 'admin'] },
  { name: "Reports", href: "/reports" },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, userProfile, signOut, openLoginModal } = useAuth();
  const [openDropdown, setOpenDropdown] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Handle navigation click - check authentication before navigating
  const handleNavClick = (href: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    // Always allow navigation to home page
    if (href === '/') {
      navigate(href);
      return;
    }
    // For protected routes, check authentication
    if (!user) {
      openLoginModal(href);
    } else {
      navigate(href);
      setOpenDropdown(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
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
            {navigation.filter((item) => {
              // Filter out items that require specific roles
              if ('requiredRoles' in item && item.requiredRoles) {
                return userProfile?.role && item.requiredRoles.includes(userProfile.role);
              }
              return true;
            }).map((item) => {
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
                            <button
                              key={child.name}
                              onClick={(e) => handleNavClick(child.href, e)}
                              className={`
                                w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors text-left
                                ${
                                  isActive
                                    ? "text-emerald-500 dark:text-emerald-400 bg-slate-100 dark:bg-slate-700"
                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                                }
                              `}
                            >
                              {child.icon && <child.icon className="w-4 h-4 flex-shrink-0" />}
                              <span className="text-left">{child.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = location.pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={(e) => handleNavClick(item.href, e)}
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
                </button>
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

          {/* User Menu / Sign In */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                <User className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {userProfile?.first_name || userProfile?.email || 'User'}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-700 dark:text-slate-300 transition-transform duration-200 ${
                    userMenuOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-lg z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {userProfile?.first_name && userProfile?.last_name
                        ? `${userProfile.first_name} ${userProfile.last_name}`
                        : userProfile?.email}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {userProfile?.email}
                    </p>
                    <p className="text-xs text-teal-600 dark:text-teal-400 mt-1 capitalize">
                      Role: {userProfile?.role || 'User'}
                    </p>
                  </div>

                  {/* Sign Out */}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openLoginModal()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-lg hover:from-emerald-700 hover:to-cyan-700 transition-colors shadow-md"
            >
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
