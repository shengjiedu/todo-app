import { useState } from 'react'
import Header from '../components/Header.jsx'
import DailyStats from '../components/DailyStats.jsx'
import TimeLinePanel from '../components/TimeLinePanel.jsx'
import TaskListPanel from '../components/TaskListPanel.jsx'
import TaskForm from '../components/TaskForm.jsx'
import TokenBudget from '../components/TokenBudget.jsx'
import MobileNav from '../components/MobileNav.jsx'
import { useTasks } from '../hooks/useTasks.js'

function DailyPlanner() {
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0])
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [mobileTab, setMobileTab] = useState('timeline') // 'timeline' | 'tasks'

  const { tasks, stats, loading, addTask, updateTask, deleteTask } = useTasks(currentDate)

  const prevDay = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 1)
    setCurrentDate(d.toISOString().split('T')[0])
  }

  const nextDay = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 1)
    setCurrentDate(d.toISOString().split('T')[0])
  }

  const handleToggle = async (id, currentStatus) => {
    await updateTask(id, { status: currentStatus === 'completed' ? 'pending' : 'completed' })
  }

  const handleEdit = (task) => {
    setEditingTask(task)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (confirm('确定删除这个任务吗？')) {
      await deleteTask(id)
    }
  }

  const handleSubmit = async (formData) => {
    if (editingTask) {
      await updateTask(editingTask.id, formData)
    } else {
      await addTask(formData)
    }
    setShowForm(false)
    setEditingTask(null)
  }

  return (
    <div className="pb-16 md:pb-0">
      <Header date={currentDate} onPrev={prevDay} onNext={nextDay} />

      <main className="max-w-7xl mx-auto px-4 py-4">
        <DailyStats stats={stats} />

        {/* Desktop: side by side */}
        <div className="hidden md:grid md:grid-cols-[320px_1fr] gap-4">
          <div className="space-y-4">
            <TimeLinePanel tasks={tasks} onTaskClick={handleEdit} />
            <TokenBudget used={stats.totalTokens} budget={stats.budget} />
          </div>
          <TaskListPanel
            tasks={tasks}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={() => { setEditingTask(null); setShowForm(true) }}
          />
        </div>

        {/* Mobile: tab switch */}
        <div className="md:hidden space-y-4">
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setMobileTab('timeline')}
              className={`flex-1 py-2 text-sm rounded-md transition ${mobileTab === 'timeline' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}
            >
              时间轴
            </button>
            <button
              onClick={() => setMobileTab('tasks')}
              className={`flex-1 py-2 text-sm rounded-md transition ${mobileTab === 'tasks' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}
            >
              任务列表
            </button>
          </div>

          {mobileTab === 'timeline' ? (
            <div className="space-y-4">
              <TimeLinePanel tasks={tasks} onTaskClick={handleEdit} />
              <TokenBudget used={stats.totalTokens} budget={stats.budget} />
            </div>
          ) : (
            <TaskListPanel
              tasks={tasks}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={() => { setEditingTask(null); setShowForm(true) }}
            />
          )}
        </div>
      </main>

      {showForm && (
        <TaskForm
          task={editingTask}
          date={currentDate}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingTask(null) }}
        />
      )}

      <MobileNav />
    </div>
  )
}

export default DailyPlanner
