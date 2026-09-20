import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { addToast } from "../store/slices/toastSlice";

/** 복사했다는 표시를 유지하는 시간 */
const COPIED_DURATION = 1500;

/**
 * 값을 클립보드로 복사하고, 방금 복사했는지를 알려준다.
 *
 * 보안 컨텍스트가 아니거나 권한이 없으면 클립보드를 쓸 수 없다.
 * 그때는 조용히 실패하지 않고 직접 복사할 수 있게 알려준다.
 */
export const useCopy = (failureMessage: string) => {
  const dispatch = useDispatch();
  const [isCopied, setIsCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  // 표시가 돌아오기 전에 화면을 떠나면 타이머만 남는다.
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(
    async (value: string, successMessage: string) => {
      try {
        await navigator.clipboard.writeText(value);

        dispatch(addToast({ type: "success", message: successMessage }));
        setIsCopied(true);

        clearTimeout(timer.current);
        timer.current = setTimeout(() => setIsCopied(false), COPIED_DURATION);
      } catch {
        dispatch(addToast({ type: "error", message: failureMessage }));
      }
    },
    [dispatch, failureMessage]
  );

  return { copy, isCopied };
};

export default useCopy;
