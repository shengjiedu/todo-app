function TimeLinePanel({ tasks, onTaskClick }) {
  const hours = Array.from({ length: 19 }, (_, i) => i + 6) // 6-24

  const getTaskForHour = (hour) => {
    return tasks.find(t => {
      const startH = parseInt(t.startTime.split(':')[0])
      return startH === hour
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-700">
        时间表
      </div>
      <div className="overflow-y-auto max-h-[600px]">
        {hours.map(hour => {
          const task = getTaskForHour(hour)
          const timeStr = `${String(hour).padStart(2, '0')}:00`

          return (
            <div
              key={hour}
              className={`flex items-center px-4 py-2 border-b border-gray-50 ${
                task ? getBgClass(task.intensity) : ''
              }`}
            >
              <span className={`w-12 text-xs ${task ? 'font-medium text-gray-700' : 'text-gray-400'}`}>
                {timeStr}
              </span>
              <div className="flex-1 ml-2">
                {task ? (
                  <button
                    onClick={() => onTaskClick(task)}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium text-white shadow-sm hover:opacity-90 transition"
                    style={{ backgroundColor: getColorHex(task.intensity) }}
                  >
                    {task.title}
                    <span className="ml-2 text-xs opacity-80">{task.brainTokens}</span>
                  </button>
                ) : (
                  <div className="h-7" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getColorHex(intensity) {
  const map = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#8b5cf6',
    extreme: '#ec4899'
  }
  return map[intensity] || '#6b7280'
}

function getBgClass(intensity) {
  const map = {
    low: 'bg-green-50',
    medium: 'bg-yellow-50',
    high: 'bg-purple-50',
    extreme: 'bg-red-50'
  }
  return map[intensity] || ''
}

export default TimeLinePanel
