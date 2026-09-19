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
  width: 100vw;
  height: 100vh;

  position: fixed;
  top: 32px;
  right: 24px;
  z-index: 9999;

  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-end;

  gap: 12px;
`;

export default ToastContainer;
