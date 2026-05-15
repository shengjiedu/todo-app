import { useState, useEffect } from 'react'

const API_URL = 'http://localhost:3001/api'

export function useSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/settings`)
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const updateSettings = async (updates) => {
    const res = await fetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    if (!res.ok) throw new Error('Failed to update settings')
    const data = await res.json()
    setSettings(data)
    return data
  }

  return { settings, loading, updateSettings, refresh: fetchSettings }
}
