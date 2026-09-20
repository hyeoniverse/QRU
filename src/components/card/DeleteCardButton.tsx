import { useState } from "react";
import { useDispatch } from "react-redux";
import { FaTrash } from "react-icons/fa6";

import { addToast } from "../../store/slices/toastSlice";
import { deleteCard } from "../../services/card";
import { CardDocument } from "../../types/cardType";
import { ButtonSize } from "../../styles/theme";

import Button from "../common/Button";
import ConfirmPopup from "../common/ConfirmPopup";
import Loading from "../common/Loading";

interface Props {
  card: CardDocument;
  /** 삭제가 끝난 뒤. 보고 있던 화면을 정리해야 한다. */
  onDeleted: () => void;
  size?: ButtonSize;
  /** 목록처럼 자리가 좁은 곳에서는 아이콘만 둔다. */
  iconOnly?: boolean;
}

/**
 * 명함을 지운다. 확인을 한 번 거친다.
 *
 * 명함 상세와 마이페이지 두 곳에서 쓴다. 지우는 일은 같은데 묻는
 * 문구가 갈리면, 무엇이 사라지는지도 자리마다 달라 보인다.
 */
function DeleteCardButton({ card, onDeleted, size = "small", iconOnly }: Props) {
  const dispatch = useDispatch();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteCard(card);
      dispatch(addToast({ type: "success", message: "명함을 삭제했습니다." }));
      setIsConfirming(false);
      onDeleted();
    } catch (error) {
      console.error("Error deleting card:", error);
      dispatch(
        addToast({ type: "error", message: "명함 삭제 중 오류가 발생했습니다." })
      );
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        size={size}
        scheme="error"
        disabled={isDeleting}
        title="명함 삭제"
        aria-label={iconOnly ? "명함 삭제" : undefined}
        onClick={() => setIsConfirming(true)}
      >
        {isDeleting ? <Loading size="small" /> : <FaTrash />}
        {!iconOnly && " 삭제"}
      </Button>

      {isConfirming && (
        <ConfirmPopup
          title="이 명함을 삭제할까요?"
          description="사진과 입력 원본까지 함께 지워집니다. 공유한 주소와 QR 코드도 열리지 않게 되고, 되돌릴 수 없습니다."
          confirmLabel="삭제"
          isDanger
          isSubmitting={isDeleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => setIsConfirming(false)}
        />
      )}
    </>
  );
}

export default DeleteCardButton;
