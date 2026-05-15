import Header from '../components/Header.jsx'
import MobileNav from '../components/MobileNav.jsx'

function HistoryPage() {
  return (
    <div>
      <Header date={new Date().toISOString().split('T')[0]} onPrev={() => {}} onNext={() => {}} />
      <main className="max-w-7xl mx-auto px-4 py-4">
        <h2 className="text-lg font-semibold mb-4">历史回顾</h2>
        <p className="text-gray-500">历史页面内容将在后续 Task 中填充</p>
      </main>
      <MobileNav />
    </div>
  )
}

export default HistoryPage
