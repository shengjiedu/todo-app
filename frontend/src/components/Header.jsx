import { Link, useLocation } from 'react-router-dom'
import dayjs from 'dayjs'

function Header({ date, onPrev, onNext }) {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">每日待办规划</h1>

          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button onClick={onPrev} className="px-3 py-1 text-gray-600 hover:bg-white rounded-md transition">&#8592;</button>
            <span className="px-3 py-1 font-medium text-gray-700 min-w-[120px] text-center">
              {dayjs(date).format('MM月DD日')}
            </span>
            <button onClick={onNext} className="px-3 py-1 text-gray-600 hover:bg-white rounded-md transition">&#8594;</button>
          </div>

          <nav className="hidden md:flex gap-1">
            {[
              { path: '/', label: '今日' },
              { path: '/history', label: '历史' },
              { path: '/settings', label: '设置' }
            ].map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  isActive(path)
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header
