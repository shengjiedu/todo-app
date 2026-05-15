import Header from '../components/Header.jsx'
import MobileNav from '../components/MobileNav.jsx'

function SettingsPage() {
  return (
    <div>
      <Header date={new Date().toISOString().split('T')[0]} onPrev={() => {}} onNext={() => {}} />
      <main className="max-w-7xl mx-auto px-4 py-4">
        <h2 className="text-lg font-semibold mb-4">设置</h2>
        <p className="text-gray-500">设置页面内容将在后续 Task 中填充</p>
      </main>
      <MobileNav />
    </div>
  )
}

export default SettingsPage
