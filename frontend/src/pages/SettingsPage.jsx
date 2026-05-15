import { useState } from 'react'
import Header from '../components/Header.jsx'
import MobileNav from '../components/MobileNav.jsx'
import { useSettings } from '../hooks/useSettings.js'

function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings()
  const [saved, setSaved] = useState(false)

  const handleChange = async (field, value) => {
    await updateSettings({ [field]: value })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading || !settings) {
    return (
      <div>
        <Header date={new Date().toISOString().split('T')[0]} onPrev={() => {}} onNext={() => {}} />
        <main className="max-w-2xl mx-auto px-4 py-8 text-center text-gray-400">加载中...</main>
        <MobileNav />
      </div>
    )
  }

  return (
    <div>
      <Header date={new Date().toISOString().split('T')[0]} onPrev={() => {}} onNext={() => {}} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold mb-6">设置</h2>

        {saved && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">设置已保存</div>
        )}

        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Token 预算</h3>
            <div>
              <label className="block text-sm text-gray-600 mb-2">每日人脑 Token 上限</label>
              <input
                type="number"
                min="100"
                max="5000"
                step="50"
                value={settings.dailyTokenBudget}
                onChange={e => handleChange('dailyTokenBudget', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-400 mt-1">建议根据你的精力状况调整，默认 1000</p>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">微信推送 (WxPusher)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">WxPusher UID</label>
                <input
                  type="text"
                  value={settings.wxPusherUID || ''}
                  onChange={e => handleChange('wxPusherUID', e.target.value)}
                  placeholder="UID_xxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">WxPusher App Token</label>
                <input
                  type="password"
                  value={settings.wxPusherToken || ''}
                  onChange={e => handleChange('wxPusherToken', e.target.value)}
                  placeholder="AT_xxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <p className="text-xs text-gray-400">
                在 <a href="https://wxpusher.zjiecode.com" target="_blank" rel="noopener" className="text-indigo-600">wxpusher.zjiecode.com</a> 获取
              </p>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">提醒时间</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">晚间提醒</label>
                <input
                  type="time"
                  value={settings.remindTime}
                  onChange={e => handleChange('remindTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-400 mt-1">提醒填写明日待办</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">早间推送</label>
                <input
                  type="time"
                  value={settings.morningPushTime}
                  onChange={e => handleChange('morningPushTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-400 mt-1">推送今日待办汇总</p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <MobileNav />
    </div>
  )
}

export default SettingsPage
