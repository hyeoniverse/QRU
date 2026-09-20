import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { auth, provider, requireAuth } from "../../services/firebase";
import {
  User,
  browserLocalPersistence,
  linkWithPopup,
  setPersistence,
  signInAnonymously,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

interface UserState {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  /**
   * 계정 없이 이 기기에서만 유지되는 사용자인지.
   *
   * 비회원이 명함을 만들면 조용히 발급된다. 소유권을 uid 로 판단하는
   * 규칙을 그대로 쓰기 위함이지 "로그인한 것"은 아니므로, 화면에서는
   * 로그인 상태와 구분해서 다룬다.
   */
  isAnonymous: boolean;
}

const toUserState = (user: User): UserState => ({
  uid: user.uid,
  displayName: user.displayName,
  email: user.email,
  photoURL: user.photoURL,
  isAnonymous: user.isAnonymous,
});

interface AuthState {
  user: UserState | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoading: true,
};

/**
 * 구글 계정으로 로그인한다.
 *
 * 익명으로 쓰던 중이라면 그 자리에 계정을 붙인다. 새로 로그인하면
 * uid 가 바뀌어 그때까지 만든 명함이 남의 것이 되어버린다.
 */
export const login = createAsyncThunk("auth/login", async () => {
  const instance = requireAuth();

  await setPersistence(instance, browserLocalPersistence);

  const current = instance.currentUser;
  if (current?.isAnonymous) {
    try {
      const linked = await linkWithPopup(current, provider);
      return toUserState(linked.user);
    } catch (error) {
      // 그 구글 계정이 이미 따로 있으면 붙일 수 없다. 그때는 그냥 들어간다.
      if ((error as { code?: string }).code !== "auth/credential-already-in-use") {
        throw error;
      }
    }
  }

  const result = await signInWithPopup(instance, provider);
  return toUserState(result.user);
});

/**
 * 계정 없이 쓸 수 있는 uid 를 챙긴다.
 *
 * 명함을 만들 때 부른다. 이미 누구든 로그인해 있으면 그 사람을 그대로 쓴다.
 */
export const ensureUser = createAsyncThunk("auth/ensureUser", async () => {
  const instance = requireAuth();

  if (instance.currentUser) return toUserState(instance.currentUser);

  await setPersistence(instance, browserLocalPersistence);
  const result = await signInAnonymously(instance);

  return toUserState(result.user);
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
    /*
     * 한 번만 듣고 끊는다.
     *
     * 콜백이 곧바로 불릴 수도 있어 unsubscribe 가 아직 없을 때가 있다.
     * 그때는 끊을 것을 표시해두고, 돌아온 뒤에 끊는다. 그러지 않으면
     * 이 듣는 이가 계속 남아 나중에 로그인할 때 또 불린다.
     */
    let unsubscribe: (() => void) | null = null;
    let isDone = false;

    const stop = () => {
      isDone = true;
      unsubscribe?.();
    };

    unsubscribe = onAuthStateChanged(
      instance,
      (user) => {
        resolve(user ? toUserState(user) : null);
        stop();
      },
      (error) => {
        reject(rejectWithValue(error.message || "Failed to check auth state"));
        stop();
      }
    );

    if (isDone) unsubscribe();
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
      })
      .addCase(ensureUser.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export default authSlice.reducer;
