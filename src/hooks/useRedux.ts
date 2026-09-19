import { TypedUseSelectorHook, useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store";

export const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useTypedDispatch = () => useDispatch<AppDispatch>();
