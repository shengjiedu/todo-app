import { useState } from 'react'
import Header from '../components/Header.jsx'
import MobileNav from '../components/MobileNav.jsx'

function DailyPlanner() {
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0])

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

  return (
    <div>
      <Header date={currentDate} onPrev={prevDay} onNext={nextDay} />
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="text-center text-gray-500 py-20">
          <p>DailyPlanner 内容将在后续 Task 中填充</p>
        </div>
      </main>
      <MobileNav />
    </div>
  )
}

export default DailyPlanner
