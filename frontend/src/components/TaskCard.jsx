const INTENSITY_LABELS = {
  low: '低强度',
  medium: '中强度',
  high: '高强度',
  extreme: '极高'
}

const INTENSITY_COLORS = {
  low: 'border-l-green-500',
  medium: 'border-l-yellow-500',
  high: 'border-l-purple-500',
  extreme: 'border-l-red-500'
}

function TaskCard({ task, onToggle, onEdit, onDelete }) {
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-xl p-4 border-l-4 ${INTENSITY_COLORS[task.intensity] || 'border-l-gray-400'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggle(task.id, task.status)}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
              task.status === 'completed'
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-indigo-500'
            }`}
          >
            {task.status === 'completed' && '✓'}
          </button>
          <span className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {task.title}
          </span>
          {task.rolloverCount > 0 && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
              顺延{task.rolloverCount}天
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(task)} className="text-xs text-gray-400 hover:text-indigo-600">编辑</button>
          <button onClick={() => onDelete(task.id)} className="text-xs text-gray-400 hover:text-red-600">删除</button>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500 ml-8">
        <span>{task.brainTokens} token</span>
        <span>{INTENSITY_LABELS[task.intensity]}</span>
        <span>{task.startTime}{task.endTime ? `-${task.endTime}` : ''}</span>
        <span>优先级 P{task.priority}</span>
      </div>
      {task.description && (
        <p className="text-xs text-gray-400 mt-2 ml-8">{task.description}</p>
      )}
    </div>
  )
}

export default TaskCard
