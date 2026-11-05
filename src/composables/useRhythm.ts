import { computed, ref } from 'nativescript-vue'
import { ApplicationSettings } from '@nativescript/core'
import { parseSaved, sessionFor, type SessionId } from '../domain/sessions'

const SAVED_KEY = 'vena.saved-rhythms.v1'
const SESSION_KEY = 'vena.selected-rhythm.v1'

export function useRhythm() {
  const selected = ref(sessionFor(ApplicationSettings.getString(SESSION_KEY, 'rest')).id)
  const running = ref(true)
  const saved = ref(parseSaved(ApplicationSettings.getString(SAVED_KEY, '[]')))
  const session = computed(() => sessionFor(selected.value))
  const isSaved = computed(() => saved.value.includes(selected.value))
  function select(id: SessionId) {
    selected.value = id; running.value = true
    ApplicationSettings.setString(SESSION_KEY, id)
  }
  function toggleSaved() {
    saved.value = isSaved.value ? saved.value.filter(id => id !== selected.value) : [...saved.value, selected.value]
    ApplicationSettings.setString(SAVED_KEY, JSON.stringify(saved.value))
  }
  return { session, selected, running, saved, isSaved, select, toggleSaved }
}
