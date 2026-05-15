function TokenBudget({ used, budget }) {
  const percent = Math.min(100, Math.round((used / budget) * 100))

  const getColor = () => {
    if (percent <= 50) return 'from-green-400 to-green-500'
    if (percent <= 80) return 'from-yellow-400 to-yellow-500'
    return 'from-red-400 to-red-500'
  }

  const getText = () => {
    if (percent <= 50) return '状态良好'
    if (percent <= 80) return '注意节奏'
    return '预算超限风险'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">人脑 Token 预算</span>
        <span className={`text-sm font-bold ${percent > 80 ? 'text-red-600' : 'text-gray-700'}`}>
          {used} / {budget}
        </span>
      </div>
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${getColor()} rounded-full transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-400">{percent}% 已使用</span>
        <span className={`text-xs ${percent > 80 ? 'text-red-500' : 'text-gray-400'}`}>{getText()}</span>
      </div>
    </div>
  )
}

export default TokenBudget
