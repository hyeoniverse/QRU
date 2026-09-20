import { useState } from "react";
import { useDispatch } from "react-redux";
import { FaFloppyDisk } from "react-icons/fa6";

import { addToast } from "../../store/slices/toastSlice";
import { MAX_CUSTOM_FIELDS } from "../../data/formFields";
import { CardFormInitial, useCardForm } from "../../hooks/useCardForm";
import { CardDocument } from "../../types/cardType";
import { updateCard } from "../../services/card";

import CardFormModal from "../form/CardFormModal";

const GUIDE = `1. 입력한 내용을 고치고 "저장" 을 누르면 명함이 바뀝니다.
* 공유한 주소와 QR 코드, 일련번호는 그대로입니다.
2. "항목 추가 버튼"으로 항목을 더할 수 있습니다.
* 최대 ${MAX_CUSTOM_FIELDS}개까지 추가 가능합니다.
3. 공개를 끈 항목은 저장과 동시에 명함에서 지워집니다.
4. 명함을 지우려면 이 창을 닫고 "삭제" 를 눌러주세요.`;

interface Props {
  card: CardDocument;
  /** 불러온 입력 원본. 이 값으로 폼을 채운다. */
  initial: CardFormInitial;
  onClose: () => void;
  /** 저장이 끝나 화면을 다시 읽어야 할 때 */
  onSaved: () => void;
}

/**
 * 이미 만든 명함을 고친다.
 *
 * 폼 화면은 생성과 같은 것을 쓴다. 다른 것은 버튼과 제출 동작뿐이다.
 * initial 은 첫 렌더에서만 읽히므로, 불러오기가 끝난 뒤에 이 컴포넌트를
 * 마운트해야 한다.
 */
function EditCardModal({ card, initial, onClose, onSaved }: Props) {
  const dispatch = useDispatch();
  const form = useCardForm(initial);

  const [isSaving, setIsSaving] = useState(false);

  const notify = (type: "success" | "error", message: string) =>
    dispatch(addToast({ type, message }));

  const handleSubmit = async () => {
    const [firstError] = Object.values(form.validate());

    if (firstError) {
      notify("error", firstError);
      return;
    }

    setIsSaving(true);

    try {
      await updateCard(card, {
        ...form.getSubmitData(),
        inShuffle: form.inShuffle,
        photo: form.photo,
      });
      notify("success", "명함을 저장했습니다.");
      onSaved();
      onClose();
    } catch (error) {
      console.error("Error updating card:", error);
      notify("error", "명함 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CardFormModal
        isOpen
        onClose={onClose}
        form={form}
        submitIcon={<FaFloppyDisk />}
        submitLabel="저장"
        isSaving={isSaving}
        onSubmit={() => void handleSubmit()}
        guide={GUIDE}
        notice="명함을 고치려면 Firebase 연결이 필요합니다."
      />
  );
}

export default EditCardModal;
