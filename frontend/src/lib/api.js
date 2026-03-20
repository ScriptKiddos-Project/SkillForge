/**
 * src/lib/api.js
 *
 * FIXES APPLIED:
 *   Bug #7: SSE onmessage checked `data.stage === 'complete'` but backend sends
 *           `{ done: true }`. The string "Complete" is the stage label, not a
 *           sentinel value. Fixed to check `data.done === true`.
 *
 *   Bug #8: AnalyzingPage received `data.stage_id` but backend sends `data.index`.
 *           The onStage callback now passes the full data object so the page can
 *           read whichever field it needs.
 */

import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — inject auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

/**
 * SSE helper for AnalyzingPage.
 *
 * EventSource cannot send custom headers, so the token is appended as a query
 * param (?token=...). The backend's /analyze/stream/{job_id} endpoint reads
 * both the Authorization header and ?token= to support this.
 *
 * @param {string}   jobId      - Job ID returned by POST /api/analyze
 * @param {Function} onStage    - Called with the raw SSE data object on each stage event
 * @param {Function} onComplete - Called with the final data object when done === true
 * @param {Function} onError    - Called with an Error on connection failure
 * @returns {Function} cleanup  - Call to close the EventSource
 */
export const createSSEStream = (jobId, onStage, onComplete, onError) => {
  const token = useAuthStore.getState().token
  // FIX #6 (backend): token passed as query param since EventSource can't set headers
  const url   = `${BASE_URL}/api/analyze/stream/${jobId}?token=${token}`
  const eventSource = new EventSource(url)

  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data)

      // FIX #7: check data.done, not data.stage === 'complete'
      if (data.done === true) {
        eventSource.close()
        if (data.error) {
          onError(new Error(data.error))
        } else {
          onComplete(data)
        }
      } else {
        // Pass the full data object — AnalyzingPage reads data.index (FIX #8)
        onStage(data)
      }
    } catch {
      onError(new Error('Failed to parse SSE event'))
    }
  }

  eventSource.onerror = () => {
    eventSource.close()
    onError(new Error('SSE connection failed'))
  }

  return () => eventSource.close()
}

export default api
