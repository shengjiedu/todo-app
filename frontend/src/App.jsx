import { useState, useEffect } from 'react'

const API_URL = 'http://localhost:3001/api'

function App() {
  const [todos, setTodos] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    try {
      const res = await fetch(`${API_URL}/todos`)
      const data = await res.json()
      setTodos(data)
    } catch (error) {
      console.error('Failed to fetch todos:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTodo = async (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    try {
      const res = await fetch(`${API_URL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputValue })
      })
      const newTodo = await res.json()
      setTodos([...todos, newTodo])
      setInputValue('')
    } catch (error) {
      console.error('Failed to add todo:', error)
    }
  }

  const toggleTodo = async (id, completed) => {
    try {
      const res = await fetch(`${API_URL}/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed })
      })
      const updatedTodo = await res.json()
      setTodos(todos.map(t => t.id === id ? updatedTodo : t))
    } catch (error) {
      console.error('Failed to toggle todo:', error)
    }
  }

  const deleteTodo = async (id) => {
    try {
      await fetch(`${API_URL}/todos/${id}`, { method: 'DELETE' })
      setTodos(todos.filter(t => t.id !== id))
    } catch (error) {
      console.error('Failed to delete todo:', error)
    }
  }

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return todo.completed
    return true
  })

  const activeCount = todos.filter(t => !t.completed).length
  const completedCount = todos.filter(t => t.completed).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">📝 待办事项</h1>
            <p className="text-indigo-100">管理你的日常任务</p>
          </div>

          <div className="p-6">
            <form onSubmit={addTodo} className="flex gap-2 mb-6">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="添加新任务..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 active:scale-95 transition-all"
              >
                添加
              </button>
            </form>

            <div className="flex justify-center gap-2 mb-6">
              {[
                { key: 'all', label: '全部', count: todos.length },
                { key: 'active', label: '进行中', count: activeCount },
                { key: 'completed', label: '已完成', count: completedCount }
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === key
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                  <span className="ml-1 text-xs opacity-75">({count})</span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-400">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-2"></div>
                <p>加载中...</p>
              </div>
            ) : filteredTodos.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-5xl mb-4">📭</p>
                <p>
                  {filter === 'all' ? '还没有任务，添加一个吧！' :
                   filter === 'active' ? '没有进行中的任务' :
                   '没有已完成的任务'}
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {filteredTodos.map(todo => (
                  <li
                    key={todo.id}
                    className="group flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                  >
                    <button
                      onClick={() => toggleTodo(todo.id, todo.completed)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        todo.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-indigo-500'
                      }`}
                    >
                      {todo.completed && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span className={`flex-1 ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {todo.text}
                    </span>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="opacity-0 group-hover:opacity-100 px-3 py-1 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      删除
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-gray-50 px-6 py-4 text-center text-sm text-gray-500">
            共 {todos.length} 个任务 · {activeCount} 个进行中
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
