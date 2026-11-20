export const COACH_SUGGESTIONS = [
  { id: 'spending', label: 'Where am I spending most?', icon: 'spending' },
  { id: 'saving', label: 'How can I save more?', icon: 'saving' },
  { id: 'purchase', label: 'Can I afford a ₹3,000 purchase?', icon: 'purchase' },
  { id: 'forecast', label: 'What does my next month look like?', icon: 'forecast' },
] as const

export type CoachSuggestionId = typeof COACH_SUGGESTIONS[number]['id']

export const COACH_SAMPLE_ANSWERS: Record<CoachSuggestionId, string> = {
  spending: 'Sample preview only: a connected coach could summarize your expense categories using your saved records. This demo does not analyze your transactions.',
  saving: 'Sample preview only: future suggestions would be based on your recorded income and expenses. No personalized analysis is generated in demo mode.',
  purchase: 'Sample preview only: purchase guidance would compare the planned cost with your recorded balance and forecast. This demo does not make that assessment.',
  forecast: 'Sample preview only: a connected coach could explain the assumptions behind your saved forecast. No prediction or advice is generated here.',
}
