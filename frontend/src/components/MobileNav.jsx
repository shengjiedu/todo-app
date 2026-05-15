import { Link, useLocation } from 'react-router-dom'

function MobileNav() {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  const tabs = [
    { path: '/', label: '今日', icon: '\u{1F4CB}' },
    { path: '/history', label: '历史', icon: '\u{1F4CA}' },
    { path: '/settings', label: '设置', icon: '\u{2699}' }
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
      <div className="flex justify-around">
        {tabs.map(({ path, label, icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center py-2 px-4 text-xs ${
              isActive(path) ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            <span className="text-lg">{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

export default MobileNav
