import TaskCard from './TaskCard.jsx'

function TaskListPanel({ tasks, onToggle, onEdit, onDelete, onAdd }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <span className="font-semibold text-gray-700">任务列表</span>
        <span className="text-xs text-gray-400">{tasks.length} 个任务</span>
      </div>
      <div className="flex-1 p-4 overflow-y-auto max-h-[500px] space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p>还没有任务，添加一个吧！</p>
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onAdd}
          className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 active:scale-95 transition"
        >
          + 添加新任务
        </button>
      </div>
    </div>
  )
}

export default TaskListPanel
