import Groq from 'groq-sdk'
import { UserProfile, MealPlan } from '@/types'
import { buildSystemPrompt, buildUserPrompt } from './systemPrompt'
import { recalculateMacros } from './macroCalculator'

export async function generateMealPlan(profile: UserProfile): Promise<MealPlan> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY no configurada')
  }

  const groq = new Groq({ apiKey })

  let completion
  try {
    completion = await groq.chat.completions.create({
    model: 'qwen/qwen3.6-27b',
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildUserPrompt(profile) },
    ],
    temperature: 0.7,
    max_tokens: 10000,
    response_format: { type: 'json_object' },
  })
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status
    if (status === 429) {
      throw new Error('RATE_LIMIT')
    }
    throw err
  }

  const responseText = completion.choices[0]?.message?.content ?? ''

  // Log first 300 chars to diagnose model output format
  console.log('[gemini] model response preview:', responseText.slice(0, 300))

  let parsed: MealPlan
  try {
    parsed = JSON.parse(responseText)
  } catch {
    // Strip markdown code fences if present: ```json ... ``` or ``` ... ```
    const stripped = responseText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim()

    // Try parsing the stripped version first
    try {
      parsed = JSON.parse(stripped)
    } catch {
      // Last resort: extract the first {...} block
      const match = stripped.match(/\{[\s\S]*\}/)
      if (!match) {
        console.error('[gemini] full response (unparseable):', responseText.slice(0, 1000))
        throw new Error('El modelo no devolvió JSON válido. Intenta de nuevo.')
      }
      parsed = JSON.parse(match[0])
    }
  }

  parsed.generatedAt = new Date().toISOString()
  parsed.weekNumber = 1
  parsed.userName = profile.name

  // Recalculate macros in code — LLM values are unreliable
  recalculateMacros(parsed)

  return parsed
}
