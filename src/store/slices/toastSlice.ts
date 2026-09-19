import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ToastType = "info" | "success" | "error";

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
}

const initialState: ToastState = {
  toasts: [],
};

const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    addToast: (
      state,
      action: PayloadAction<{
        message: string;
        type?: ToastType;
        duration?: number;
      }>
    ) => {
      // 동일한 메시지를 가진 toast 제거
      state.toasts = state.toasts.filter(
        (toast) => toast.message !== action.payload.message
      );

      // 새로운 toast 추가
      state.toasts.push({
        id: Date.now(),
        message: action.payload.message,
        type: action.payload.type || "info",
        duration: action.payload.duration || 3000, // 기본 3초
      });
    },
    removeToast: (state, action: PayloadAction<number>) => {
      state.toasts = state.toasts.filter(
        (toast) => toast.id !== action.payload
      );
    },
  },
});

export const { addToast, removeToast } = toastSlice.actions;
export default toastSlice.reducer;
