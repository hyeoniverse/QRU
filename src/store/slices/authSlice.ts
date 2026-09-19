import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { auth, provider, requireAuth } from "../../services/firebase";
import {
  browserLocalPersistence,
  setPersistence,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

interface UserState {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthState {
  user: UserState | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoading: true,
};

// Async thunk for login
export const login = createAsyncThunk("auth/login", async () => {
  const instance = requireAuth();

  await setPersistence(instance, browserLocalPersistence);
  const result = await signInWithPopup(instance, provider);

  // 필요한 데이터만 반환
  const { uid, displayName, email, photoURL } = result.user;
  return { uid, displayName, email, photoURL };
});

// Async thunk for logout
export const logout = createAsyncThunk("auth/logout", async () => {
  await signOut(requireAuth());
});

// 비동기 Thunk 정의
export const checkUserState = createAsyncThunk<
  UserState | null, // 성공 시 반환 타입
  void, // 전달받는 인수 타입
  { rejectValue: string } // reject 시 반환 타입
>("auth/checkUserState", async (_, { rejectWithValue }) => {
  // 설정이 없으면 로그인 상태를 확인할 수 없다. 비로그인으로 둔다.
  if (!auth) return null;

  const instance = auth;

  return new Promise<UserState | null>((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      instance,
      (user) => {
        if (user) {
          const { uid, displayName, email, photoURL } = user;
          resolve({ uid, displayName, email, photoURL });
        } else {
          resolve(null);
        }
        unsubscribe();
      },
      (error) => {
        reject(rejectWithValue(error.message || "Failed to check auth state"));
      }
    );
  });
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isLoading = false;
      })
      .addCase(login.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(checkUserState.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkUserState.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isLoading = false;
      })
      .addCase(checkUserState.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export default authSlice.reducer;
