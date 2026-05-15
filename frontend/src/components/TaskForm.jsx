import { useState, useEffect } from 'react'

function TaskForm({ task, date, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    startTime: '08:00',
    endTime: '',
    brainTokens: 50,
    priority: 3,
    autoRollover: true
  })

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || '',
        startTime: task.startTime,
        endTime: task.endTime || '',
        brainTokens: task.brainTokens,
        priority: task.priority,
        autoRollover: task.autoRollover === 1
      })
    }
  }, [task])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSubmit({
      ...form,
      title: form.title.trim(),
      scheduledDate: date,
      endTime: form.endTime || undefined
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">{task ? '编辑任务' : '添加任务'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">任务名称 *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="例如：看钙钛矿论文日报"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始时间 *</label>
              <input
                type="time"
                value={form.startTime}
                onChange={e => setForm({ ...form, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
              <input
                type="time"
                value={form.endTime}
                onChange={e => setForm({ ...form, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              人脑 Token ({form.brainTokens})
            </label>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={form.brainTokens}
              onChange={e => setForm({ ...form, brainTokens: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0 (轻松)</span>
              <span>250 (中等)</span>
              <span>500+ (烧脑)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">优先级 (1-5)</label>
              <select
                value={form.priority}
                onChange={e => setForm({ ...form, priority: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {[1, 2, 3, 4, 5].map(p => (
                  <option key={p} value={p}>P{p} {p === 5 ? '(最高)' : p === 1 ? '(最低)' : ''}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.autoRollover}
                  onChange={e => setForm({ ...form, autoRollover: e.target.checked })}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-sm text-gray-700">未完成自动顺延</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {task ? '保存' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskForm
