function DailyStats({ stats }) {
  const { total, pending, completed, totalTokens, budget } = stats
  const usagePercent = Math.min(100, Math.round((totalTokens / budget) * 100))

  const getColor = () => {
    if (usagePercent <= 50) return 'bg-green-500'
    if (usagePercent <= 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{total}</div>
            <div className="text-xs text-gray-500">总任务</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{pending}</div>
            <div className="text-xs text-gray-500">进行中</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completed}</div>
            <div className="text-xs text-gray-500">已完成</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{totalTokens}</span> / {budget} token
          </div>
          <div className="text-xs text-gray-400">今日脑力预算</div>
        </div>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${getColor()} rounded-full transition-all`} style={{ width: `${usagePercent}%` }} />
      </div>
    </div>
  )
}

export default DailyStats
