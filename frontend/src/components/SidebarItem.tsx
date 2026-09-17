import { Link } from "react-router-dom"

interface SidebarItemProps {
  icon: React.ReactNode
  label: string
  to: string
  collapsed?: boolean
  active?: boolean
}

const SidebarItem = ({ icon, label, to, collapsed, active }: SidebarItemProps) => {
  return (
    <Link to={to} className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition-colors ${active ? "bg-indigo-50 text-indigo-600 font-medium" : "text-gray-600 hover:bg-gray-100"}`}>
      {icon}
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}

export default SidebarItem
