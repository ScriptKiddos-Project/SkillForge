import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const usePathwayStore = create(
  persist(
    (set, get) => ({
      pathway: null,
      skillProfile: null,
      chatHistory: [],
      activeStep: null,
      quizResults: [],
      chatWidth: 288,
      setChatWidth: (w) => set({ chatWidth: w }),

      setPathway: (pathway) => set({ pathway }),
      setSkillProfile: (skillProfile) => set({ skillProfile }),
      setActiveStep: (step) => set({ activeStep: step }),

      addMessage: (message) =>
        set((state) => ({
          chatHistory: [...state.chatHistory, { ...message, id: `msg-${Date.now()}`, timestamp: new Date().toISOString() }],
        })),

      setChatHistory: (chatHistory) => set({ chatHistory }),

      updateStepStatus: (stepId, status, quizScore = null) =>
        set((state) => {
          if (!state.pathway) return state
          const steps = state.pathway.steps.map((s) =>
            s.id === stepId
              ? { ...s, status, quiz_score: quizScore !== null ? quizScore : s.quiz_score }
              : s
          )
          return { pathway: { ...state.pathway, steps } }
        }),

      addQuizResult: (result) =>
        set((state) => ({ quizResults: [...state.quizResults, result] })),

      clearPathway: () => set({ pathway: null, skillProfile: null, chatHistory: [], activeStep: null }),
    }),
    {
      name: 'skillforge-pathway',
    },
  )
)