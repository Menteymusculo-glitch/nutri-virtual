import Groq from 'groq-sdk'
import { UserProfile, MealPlan } from '@/types'
import { buildSystemPrompt, buildUserPrompt } from './systemPrompt'

export async function generateMealPlan(profile: UserProfile): Promise<MealPlan> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY no configurada')
  }

  const groq = new Groq({ apiKey })

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildUserPrompt(profile) },
    ],
    temperature: 0.7,
    max_tokens: 7500,
    response_format: { type: 'json_object' },
  })

  const responseText = completion.choices[0]?.message?.content ?? ''

  let parsed: MealPlan
  try {
    parsed = JSON.parse(responseText)
  } catch {
    const match = responseText.match(/\{[\s\S]*\}/)
    if (!match) {
      throw new Error('El modelo no devolvió JSON válido. Intenta de nuevo.')
    }
    parsed = JSON.parse(match[0])
  }

  parsed.generatedAt = new Date().toISOString()
  parsed.weekNumber = 1
  parsed.userName = profile.name

  return parsed
}
