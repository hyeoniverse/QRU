import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaPen } from "react-icons/fa6";

import { AppDispatch, RootState } from "../../store";
import { ensureUser } from "../../store/slices/authSlice";
import { closeModal } from "../../store/slices/modalSlice";
import { ToastType, addToast } from "../../store/slices/toastSlice";
import { MAX_CUSTOM_FIELDS } from "../../data/formFields";
import { useCardForm } from "../../hooks/useCardForm";
import { NewCard } from "../../types/cardType";
import { createCard } from "../../services/card";

import CardFormModal from "../form/CardFormModal";

const GUIDE = `1. "항목 추가 버튼"으로 추가적인 정보를 입력할 수 있습니다.
* 최대 ${MAX_CUSTOM_FIELDS}개까지 추가 가능합니다.
2. "명함 생성 버튼"을 눌러 명함을 생성합니다.
* 필수 입력 항목을 모두 입력해야 합니다.
3. 각 항목에 대한 공개 여부를 선택할 수 있습니다.
* 공개로 설정하신 항목의 내용은 비울 수 없습니다.
4. 만든 명함은 마이 페이지에서 언제든 고치거나 지울 수 있습니다.
* 로그인하지 않아도 이 기기에서는 그대로 남아 있습니다.
* 다른 기기에서도 관리하려면 로그인해주세요.`;

function NewCardModal() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const isModalOpen = useSelector((state: RootState) => state.modal.isModalOpen);

  const navigate = useNavigate();

  const form = useCardForm();
  const [isSaving, setIsSaving] = useState(false);

  const notify = (type: ToastType, message: string) =>
    dispatch(addToast({ type, message }));

  const handleClose = () => {
    form.reset();
    dispatch(closeModal());
  };

  const saveCard = async (input: NewCard) => {
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

  /**
   * 명함을 만든다.
   *
   * 로그인하지 않았다면 계정 없이 쓸 수 있는 uid 를 먼저 챙긴다.
   * 소유자가 있어야 나중에 고치거나 지울 수 있다.
   */
  const handleSubmit = async () => {
    const [firstError] = Object.values(form.validate());

    if (firstError) {
      notify("error", firstError);
      return;
    }

    setIsSaving(true);

    let owner = user;

    if (!owner) {
      try {
        owner = await dispatch(ensureUser()).unwrap();
      } catch (error) {
        console.error("Error preparing owner:", error);
        setIsSaving(false);
        notify("error", "명함을 만들 준비에 실패했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }
    }

    const input: NewCard = {
      ...form.getSubmitData(),
      uid: owner.uid,
      inShuffle: form.inShuffle,
      ...(form.photo ? { photo: form.photo } : {}),
    };

    await saveCard(input);
  };

  return (
    <CardFormModal
      isOpen={isModalOpen}
      onClose={handleClose}
      form={form}
      submitIcon={<FaPen />}
      submitLabel="명함 생성"
      isSaving={isSaving}
      onSubmit={() => void handleSubmit()}
      guide={GUIDE}
      notice="명함을 만들고 저장하려면 Firebase 연결이 필요합니다."
    />
  );
}

export default NewCardModal;
