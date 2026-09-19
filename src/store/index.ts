import { configureStore } from "@reduxjs/toolkit";
import reducer from "./reducer/reducer";
import { checkUserState } from "./slices/authSlice";

const store = configureStore({
  reducer,
});

store.dispatch(checkUserState());

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
