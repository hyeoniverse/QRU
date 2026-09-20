import { useSelector } from "react-redux";
import { RootState } from "../../../store";

import styled from "styled-components";
import Toast from "./Toast";
import { createPortal } from "react-dom";

function ToastContainer() {
  const toasts = useSelector((state: RootState) => state.toast.toasts);

  return createPortal(
    <ToastContainerStyle>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
        />
      ))}
    </ToastContainerStyle>,
    document.body
  );
}

const ToastContainerStyle = styled.div`
  pointer-events: none;

  position: fixed;
  /* 고정 헤더에 가리지 않도록 그 아래에서 시작한다. */
  top: calc(${({ theme }) => theme.layout.headerHeight} + 1rem);
  right: 1.5rem;
  /* 좁은 화면에서 토스트가 화면 밖으로 나가지 않게 한다. */
  max-width: calc(100vw - 3rem);
  z-index: 9999;

  display: flex;
  flex-direction: column;
  align-items: flex-end;

  gap: 12px;
`;

export default ToastContainer;
