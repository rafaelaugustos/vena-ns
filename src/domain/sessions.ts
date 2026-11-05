export type SessionId = 'rest' | 'move' | 'recover'

export interface Session {
  id: SessionId
  label: string
  title: string
  subtitle: string
  bpm: number
  range: string
  time: string
  duration: string
}

export const sessions: readonly Session[] = [
  { id: 'rest', label: 'At rest', title: 'A quieter moment.', subtitle: 'A little space between the beats.', bpm: 72, range: '68–76', time: '09:41', duration: '15 sec' },
  { id: 'move', label: 'In motion', title: 'Finding your pace.', subtitle: 'A different rhythm. The same you.', bpm: 108, range: '98–116', time: '08:12', duration: '30 sec' },
  { id: 'recover', label: 'Unwind', title: 'Let the day settle.', subtitle: 'Watch the rhythm slow down.', bpm: 58, range: '56–64', time: '21:06', duration: '20 sec' },
]

export function sessionFor(id: unknown): Session {
  return sessions.find(session => session.id === id) ?? sessions[0]!
}

export function parseSaved(value: string): SessionId[] {
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return sessions.filter(session => parsed.includes(session.id)).map(session => session.id)
  } catch { return [] }
}

/** A stylized pulse for the LED display, not an ECG or a diagnostic signal. */
export function pulseAt(phase: number): number {
  const p = ((phase % 1) + 1) % 1
  const bump = (center: number, width: number, amplitude: number) => amplitude * Math.exp(-(((p - center) / width) ** 2))
  return bump(.18, .055, .15) - bump(.33, .03, .22) + bump(.41, .045, 1) - bump(.50, .035, .42) + bump(.69, .075, .25)
}
