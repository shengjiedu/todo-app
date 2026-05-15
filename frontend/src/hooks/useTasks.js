import { useState, useEffect, useCallback } from 'react'

const API_URL = 'http://localhost:3001/api'

export function useTasks(date) {
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, totalTokens: 0, budget: 1000 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/tasks?date=${date}`)
      if (!res.ok) throw new Error('Failed to fetch tasks')
      const data = await res.json()
      setTasks(data)

      const todayRes = await fetch(`${API_URL}/schedule/today`)
      if (todayRes.ok) {
        const todayData = await todayRes.json()
        if (todayData.date === date) {
          setStats(todayData.stats)
        } else {
          const totalTokens = data.filter(t => t.status === 'pending').reduce((s, t) => s + t.brainTokens, 0)
          setStats({
            total: data.length,
            pending: data.filter(t => t.status === 'pending').length,
            completed: data.filter(t => t.status === 'completed').length,
            totalTokens,
            budget: 1000
          })
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const addTask = async (taskData) => {
    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    })
    if (!res.ok) throw new Error('Failed to add task')
    await fetchTasks()
    return res.json()
  }

  const updateTask = async (id, updates) => {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    if (!res.ok) throw new Error('Failed to update task')
    await fetchTasks()
    return res.json()
  }

  const deleteTask = async (id) => {
    const res = await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete task')
    await fetchTasks()
  }

  return { tasks, stats, loading, error, addTask, updateTask, deleteTask, refresh: fetchTasks }
}
