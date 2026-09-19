import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { FaCircleInfo, FaPen, FaPlus } from "react-icons/fa6";

import { RootState } from "../../store";
import { closeModal } from "../../store/slices/modalSlice";
import { ToastType, addToast } from "../../store/slices/toastSlice";
import { MAX_CUSTOM_FIELDS } from "../../data/formFields";
import { useCardForm } from "../../hooks/useCardForm";
import { CARD_COLLECTION, CardPayload } from "../../types/cardType";
import { CARD_FORM_ID } from "../../utils/formUtil";
import { saveToFirestore } from "../../utils/firestoreUtil";
import { encryptPassword } from "../../utils/passwordUtil";

import Modal from "../common/Modal";
import Button from "../common/Button";
import Form from "../form/Form";
import PasswordPopup from "./PasswordPopup";

const GUIDE = `1. "항목 추가 버튼"으로 추가적인 정보를 입력할 수 있습니다.
* 최대 ${MAX_CUSTOM_FIELDS}개까지 추가 가능합니다.
2. "명함 생성 버튼"을 눌러 명함을 생성합니다.
* 필수 입력 항목을 모두 입력해야 합니다.
3. 각 항목에 대한 공개 여부를 선택할 수 있습니다.
* 공개로 설정하신 항목의 내용은 비울 수 없습니다.
4. 비회원의 경우 1개월 동안만 명함이 유지됩니다.
5. 비회원의 경우 생성한 명함을 수정 및 삭제하기 위해서는 생성 시 고지된 일련번호와 입력하신 비밀번호가 필요합니다.
* 회원의 경우 마이 페이지에서 명함을 확인 및 관리할 수 있습니다.`;

function NewCardModal() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const isModalOpen = useSelector((state: RootState) => state.modal.isModalOpen);

  const form = useCardForm();
  // 비회원은 비밀번호를 받은 뒤에 저장하므로 제출할 내용을 잠시 들고 있는다.
  const [pendingPayload, setPendingPayload] = useState<CardPayload | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { customFieldCount } = form;

  const notify = (type: ToastType, message: string) =>
    dispatch(addToast({ type, message }));

  // 항목을 추가하면 새로 생긴 입력이 보이도록 끝까지 스크롤한다.
  useEffect(() => {
    if (customFieldCount > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [customFieldCount]);

  const handleClose = () => {
    setPendingPayload(null);
    form.reset();
    dispatch(closeModal());
  };

  const handleAddField = () => {
    if (!form.canAddCustomField) {
      notify("error", `추가 항목은 최대 ${MAX_CUSTOM_FIELDS}개까지 입력할 수 있습니다.`);
      return;
    }

    form.addCustomField();
  };

  const saveCard = async (payload: CardPayload) => {
    setIsSaving(true);

    try {
      await saveToFirestore(
        payload.uid ? CARD_COLLECTION.member : CARD_COLLECTION.guest,
        payload
      );
      notify("success", "명함이 성공적으로 생성되었습니다.");
      handleClose();
    } catch (error) {
      console.error("Error saving card:", error);
      notify("error", "명함 생성 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = () => {
    const [firstError] = Object.values(form.validate());

    if (firstError) {
      notify("error", firstError);
      return;
    }

    const payload: CardPayload = {
      ...form.getSubmitData(),
      createdAt: new Date().toISOString(),
      uid: user?.uid ?? null,
    };

    if (!user) {
      setPendingPayload(payload);
      return;
    }

    void saveCard(payload);
  };

  const handlePasswordSubmit = (password: string) => {
    if (!pendingPayload) return;

    void saveCard({ ...pendingPayload, password: encryptPassword(password) });
  };

  return (
    <>
      <Modal isOpen={isModalOpen} onClose={handleClose}>
        <StyledNewCard>
          <div className="form-title">
            <div className="form-title-buttons">
              <Button
                type="button"
                size="small"
                scheme="secondary"
                boxShadow="none"
                aria-label="명함 생성 안내"
                tooltip={GUIDE}
              >
                <FaCircleInfo />
              </Button>
              <Button type="button" size="small" onClick={handleAddField}>
                <FaPlus /> 항목 추가
              </Button>
              <Button
                type="submit"
                form={CARD_FORM_ID}
                size="small"
                disabled={isSaving}
              >
                <FaPen /> 명함 생성
              </Button>
            </div>
          </div>
          <div className="form-content" ref={scrollRef}>
            <Form
              fields={form.fields}
              values={form.values}
              isPublic={form.isPublic}
              errors={form.errors}
              onValueChange={form.changeValue}
              onVisibilityChange={form.changeVisibility}
              onFieldBlur={form.blurField}
              onCustomFieldRemove={form.removeCustomField}
              onSubmit={handleSubmit}
            />
          </div>
        </StyledNewCard>
      </Modal>

      {pendingPayload && (
        <PasswordPopup
          isSubmitting={isSaving}
          onSubmit={handlePasswordSubmit}
          onCancel={() => setPendingPayload(null)}
        />
      )}
    </>
  );
}

const StyledNewCard = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 0.5rem;
  overflow: clip;

  .form-title {
    position: sticky;
    top: 0;
    left: 0;

    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem 1rem 0.5rem 1rem;
    overflow: visible;
    z-index: 10;

    .form-title-buttons {
      display: flex;
      flex-direction: row;
      gap: 0.5rem;
    }
  }

  .form-content {
    padding: 0 2rem 2rem 2rem;
    overflow-y: scroll;
    border-radius: ${({ theme }) => theme.borderRadius.default};
    scroll-behavior: smooth;
    backdrop-filter: blur(8px);
  }
`;

export default NewCardModal;
