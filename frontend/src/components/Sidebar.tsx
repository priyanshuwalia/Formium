import {
  BarChart,
  List,
  Settings,
  Home,
  Plus,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  LifeBuoy,
  HelpCircle,
  MessageCircle,
  User as UserIcon,
  Building2,
  Menu,
  X,
  Moon,
  Sun,
} from "lucide-react";
import SidebarItem from "./SidebarItem";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import Logo from "./Logo";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [workspaces, setWorkspaces] = useState<string[]>(["My Workspace"]);
  const [activeWorkspace, setActiveWorkspace] = useState("My Workspace");
  const { user: User, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const storedWorkspaces = localStorage.getItem("workspaces");
    const storedActive = localStorage.getItem("activeWorkspaceName");
    if (storedWorkspaces) {
      try {
        const parsed = JSON.parse(storedWorkspaces);
        if (Array.isArray(parsed) && parsed.length > 0) setWorkspaces(parsed);
      } catch {
        localStorage.removeItem("workspaces");
      }
    }
    if (storedActive) setActiveWorkspace(storedActive);
  }, []);

  const selectWorkspace = (workspace: string) => {
    setActiveWorkspace(workspace);
    localStorage.setItem("activeWorkspaceName", workspace);
    window.dispatchEvent(new Event("workspace-change"));
  };

  const createWorkspace = () => {
    const name = window.prompt("Workspace name", `Workspace ${workspaces.length + 1}`);
    if (!name?.trim()) return;
    const updated = [...workspaces, name.trim()];
    setWorkspaces(updated);
    localStorage.setItem("workspaces", JSON.stringify(updated));
    selectWorkspace(name.trim());
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleMobileSidebar = () => setMobileOpen(!mobileOpen);

  return (
    <>
      {}
      <button
        onClick={toggleMobileSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-md shadow-md text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between transition-all duration-300
          ${collapsed ? "lg:w-16" : "lg:w-64"}
          ${mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {}
        <div className="p-3">
          <div className="flex items-center justify-between mb-4">
            {(!collapsed || mobileOpen) && (
              <div className="flex items-center gap-3 pl-2 lg:pl-0">
                <Logo size={28} />
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  Formium
                </div>
              </div>
            )}

            {}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:block text-gray-600 dark:text-gray-400 ml-2.5 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              {collapsed ? (
                <ChevronRight size={20} />
              ) : (
                <ChevronLeft size={20} />
              )}
            </button>

            {}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <X size={20} />
            </button>
          </div>

          {}
          <nav className="space-y-4">
            <SidebarItem
              icon={<Home />}
              label="Home"
              to="/home"
              collapsed={collapsed && !mobileOpen}
              active={location.pathname === "/home"}
            />
            <SidebarItem
              icon={<List />}
              label="All Forms"
              to="/forms"
              collapsed={collapsed && !mobileOpen}
              active={location.pathname === "/forms"}
            />
            <SidebarItem
              icon={<BarChart />}
              label="Analytics"
              to="/analytics"
              collapsed={collapsed && !mobileOpen}
              active={location.pathname === "/analytics"}
            />
            <SidebarItem
              icon={<Settings />}
              label="Settings"
              to="/settings"
              collapsed={collapsed && !mobileOpen}
              active={location.pathname === "/settings"}
            />

            {}
            <div className={`${collapsed && !mobileOpen ? "hidden" : "block"} mt-4`}>
              <div className="flex items-center justify-between text-sm mb-3 text-gray-600 dark:text-gray-400 font-normal px-2">
                <span>Workspaces</span>
                <button
                  onClick={createWorkspace}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-indigo-500 dark:hover:text-indigo-400"
                  title="Create workspace"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-1" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
                {workspaces.map((workspace) => (
                  <button
                    key={workspace}
                    onClick={() => selectWorkspace(workspace)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-2xl cursor-pointer transition-colors text-left ${
                      workspace === activeWorkspace
                        ? "bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/70"
                    }`}
                  >
                    <Building2 size={16} className="shrink-0" />
                    <span className="truncate">{workspace}</span>
                    {hovered && workspace === activeWorkspace && (
                      <ChevronRight size={16} className="ml-auto text-gray-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </nav>
        </div>

        {}
        <div>
          {}
          {(!collapsed || mobileOpen) && (
            <div className="p-3 space-y-2 text-sm text-gray-700 dark:text-gray-300 border-t border-gray-300 dark:border-gray-800">
              {}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded cursor-pointer text-left"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </button>

              <div className="text-gray-600 dark:text-gray-400 mb-1 px-2 mt-4">
                Help
              </div>
              <div onClick={() => navigate("/get-started")} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-2xl cursor-pointer">
                <BookOpen size={16} /> Get started
              </div>
              <div onClick={() => navigate("/how-to-guides")} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-2xl cursor-pointer">
                <LifeBuoy size={16} /> How-to guides
              </div>
              <div onClick={() => navigate("/help-center")} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-2xl cursor-pointer">
                <HelpCircle size={16} /> Help center
              </div>
              <div className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-2xl cursor-pointer">
                <MessageCircle size={16} /> Contact support
              </div>
            </div>
          )}

          {}
          {(!collapsed || mobileOpen) && (
            <div onClick={() => navigate("/profile")} className="p-4 border-t border-gray-300 dark:border-gray-800 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
              <UserIcon
                size={24}
                className="text-indigo-600 dark:text-indigo-400"
              />
              <div className="text-sm overflow-hidden text-gray-900 dark:text-white">
                <div className="font-medium truncate">{User?.email}</div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    handleLogout();
                  }}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
