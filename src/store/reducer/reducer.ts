import authReducer from "../slices/authSlice";
import toastReducer from "../slices/toastSlice";
import modalReducer from "../slices/modalSlice";

const reducer = {
  auth: authReducer,
  toast: toastReducer,
  modal: modalReducer,
};

export default reducer;
