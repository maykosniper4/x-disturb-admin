import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { v4 as uuidv4 } from "uuid"

export interface Notification {
  id: string
  user: string
  zone: string
  time: string
  read: boolean
  timestamp: number
}

interface NotificationsState {
  items: Notification[]
  loading: boolean
  error: string | null
}

const initialState: NotificationsState = {
  items: [],
  loading: false,
  error: null,
}

export const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, "id" | "timestamp">>) => {
      state.items.unshift({
        ...action.payload,
        id: uuidv4(),
        timestamp: Date.now(),
      })
    },
    deleteNotification: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((notification) => notification.id !== action.payload)
    },
    clearAllNotifications: (state) => {
      state.items = []
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.items.find((n) => n.id === action.payload)
      if (notification) {
        notification.read = true
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach((notification) => {
        notification.read = true
      })
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    loadMoreNotifications: (state) => {
      state.loading = false
    },
  },
})

export const {
  addNotification,
  deleteNotification,
  clearAllNotifications,
  markAsRead,
  markAllAsRead,
  setLoading,
  setError,
  loadMoreNotifications,
} = notificationsSlice.actions

export default notificationsSlice.reducer
