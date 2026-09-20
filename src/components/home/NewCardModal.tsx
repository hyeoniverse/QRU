import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaPen } from "react-icons/fa6";

import { RootState } from "../../store";
import { closeModal } from "../../store/slices/modalSlice";
import { ToastType, addToast } from "../../store/slices/toastSlice";
import { MAX_CUSTOM_FIELDS } from "../../data/formFields";
import { useCardForm } from "../../hooks/useCardForm";
import { NewCard } from "../../types/cardType";
import { createCard } from "../../services/card";
import { hashPassword } from "../../utils/passwordUtil";

import CardFormModal from "../form/CardFormModal";
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

  const navigate = useNavigate();

  const form = useCardForm();
  // 비회원은 비밀번호를 받은 뒤에 저장하므로 제출할 내용을 잠시 들고 있는다.
  const [pendingCard, setPendingCard] = useState<NewCard | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const notify = (type: ToastType, message: string) =>
    dispatch(addToast({ type, message }));

  const handleClose = () => {
    setPendingCard(null);
    form.reset();
    dispatch(closeModal());
  };

  const saveCard = async (input: NewCard) => {
    setIsSaving(true);

    try {
      const { id } = await createCard(input);
      notify("success", "명함이 생성되었습니다.");
      handleClose();
      // 일련번호와 QR 코드를 바로 확인할 수 있도록 생성한 명함으로 이동한다.
      navigate(`/cards/${id}`, { state: { justCreated: true } });
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

    const input: NewCard = {
      ...form.getSubmitData(),
      uid: user?.uid ?? null,
      inShuffle: form.inShuffle,
      ...(form.photo ? { photo: form.photo } : {}),
    };

    if (!user) {
      setPendingCard(input);
      return;
    }

    void saveCard(input);
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!pendingCard) return;

    await saveCard({ ...pendingCard, password: await hashPassword(password) });
  };

  return (
    <>
      <CardFormModal
        isOpen={isModalOpen}
        onClose={handleClose}
        form={form}
        submitIcon={<FaPen />}
        submitLabel="명함 생성"
        isSaving={isSaving}
        onSubmit={handleSubmit}
        guide={GUIDE}
        notice="명함을 만들고 저장하려면 Firebase 연결이 필요합니다."
      />

      {pendingCard && (
        <PasswordPopup
          isSubmitting={isSaving}
          onSubmit={handlePasswordSubmit}
          onCancel={() => setPendingCard(null)}
        />
      )}
    </>
  );
}

export default NewCardModal;
