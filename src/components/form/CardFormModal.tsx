import { ReactNode, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { FaCircleInfo, FaPlus } from "react-icons/fa6";

import { addToast } from "../../store/slices/toastSlice";
import { MAX_CUSTOM_FIELDS } from "../../data/formFields";
import { CardFormController } from "../../hooks/useCardForm";
import { CARD_FORM_ID } from "../../utils/formUtil";
import { isFirebaseConfigured } from "../../services/firebase";

import Modal from "../common/Modal";
import InputCheck from "../common/InputCheck";
import Button from "../common/Button";
import FirebaseNotice from "../common/FirebaseNotice";
import Form from "./Form";
import PhotoPicker from "./PhotoPicker";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  form: CardFormController;
  /** 제출 버튼에 들어갈 아이콘과 문구 */
  submitIcon: ReactNode;
  submitLabel: string;
  isSaving: boolean;
  onSubmit: () => void;
  /** 물음표 버튼에 붙는 안내 문구 */
  guide: string;
  /** 제출 버튼 옆에 더 붙일 것. 수정 화면의 삭제 버튼 등 */
  extraActions?: ReactNode;
  /** Firebase 설정이 없을 때 보여줄 문구 */
  notice: string;
}

/**
 * 명함 폼을 담는 모달.
 *
 * 생성과 수정이 같은 화면을 쓴다. 다른 것은 버튼 문구와 제출 동작뿐이라
 * 폼 상태(form)와 제출을 밖에서 받는다.
 */
function CardFormModal({
  isOpen,
  onClose,
  form,
  submitIcon,
  submitLabel,
  isSaving,
  onSubmit,
  guide,
  extraActions,
  notice,
}: Props) {
  const dispatch = useDispatch();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { customFieldCount } = form;
  const previousCount = useRef(customFieldCount);

  /**
   * 항목을 추가하면 새로 생긴 입력이 보이도록 끝까지 스크롤한다.
   *
   * 늘어났을 때만 움직인다. 수정 화면은 이미 있는 추가 항목을 들고
   * 열리는데, 개수만 보면 그것도 방금 추가한 것으로 보여 맨 아래에서
   * 시작하게 된다.
   */
  useEffect(() => {
    const grew = customFieldCount > previousCount.current;
    previousCount.current = customFieldCount;

    if (grew && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [customFieldCount]);

  const handleAddField = () => {
    if (!form.canAddCustomField) {
      dispatch(
        addToast({
          type: "error",
          message: `추가 항목은 최대 ${MAX_CUSTOM_FIELDS}개까지 입력할 수 있습니다.`,
        })
      );
      return;
    }

    form.addCustomField();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <StyledCardFormModal>
        <div className="form-title">
          <div className="form-title-buttons">
            <Button
              type="button"
              size="small"
              scheme="secondary"
              boxShadow="none"
              aria-label="명함 작성 안내"
              tooltip={guide}
            >
              <FaCircleInfo />
            </Button>
            {isFirebaseConfigured && (
              <>
                <Button type="button" size="small" onClick={handleAddField}>
                  <FaPlus /> 항목 추가
                </Button>
                <Button
                  type="submit"
                  form={CARD_FORM_ID}
                  size="small"
                  disabled={isSaving}
                >
                  {submitIcon} {submitLabel}
                </Button>
                {extraActions}
              </>
            )}
          </div>

          {isFirebaseConfigured && (
            <label className="shuffle-toggle" htmlFor="in-shuffle">
              <InputCheck
                id="in-shuffle"
                checked={form.inShuffle}
                onChange={(event) => form.changeShuffle(event.target.checked)}
              />
              <span>
                랜덤 셔플에 내 명함 노출
                <em>공개로 설정한 항목만 다른 사람에게 보입니다.</em>
              </span>
            </label>
          )}
        </div>

        <div className="form-content" ref={scrollRef}>
          {isFirebaseConfigured ? (
            <>
              <div className="form-photo">
                <PhotoPicker
                  value={form.photo}
                  onChange={form.changePhoto}
                  onError={(message) =>
                    dispatch(addToast({ type: "error", message }))
                  }
                />
                <div className="form-photo-text">
                  <p className="photo-title">사진</p>
                  <p className="photo-hint">
                    동그라미를 누르면 사진을 넣고, 위치와 크기를 맞출 수 있습니다.
                  </p>
                </div>
              </div>
              <Form
                fields={form.fields}
                values={form.values}
                isPublic={form.isPublic}
                errors={form.errors}
                onValueChange={form.changeValue}
                onVisibilityChange={form.changeVisibility}
                onFieldBlur={form.blurField}
                onCustomFieldRemove={form.removeCustomField}
                onSubmit={onSubmit}
              />
            </>
          ) : (
            <FirebaseNotice description={notice} />
          )}
        </div>
      </StyledCardFormModal>
    </Modal>
  );
}

const StyledCardFormModal = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 0.5rem;
  /* 안내 툴팁이 모달 밖까지 펼쳐질 수 있어야 하므로 여기서 자르지 않는다. */
  overflow: visible;
  /* 대신 내부 스크롤 영역이 높이를 넘겨받을 수 있도록 축소를 허용한다. */
  min-height: 0;

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
    padding: 1.5rem 2rem 0.5rem;
    overflow: visible;
    z-index: 10;

    .form-title-buttons {
      display: flex;
      flex-direction: row;
      gap: 0.5rem;
    }

    .shuffle-toggle {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      /* 좌우 여백은 상위(.form-title)가 이미 갖고 있다. */

      span {
        display: flex;
        flex-direction: column;
        font-size: ${({ theme }) => theme.fontSize.small};
      }

      em {
        font-style: normal;
        font-size: ${({ theme }) => theme.fontSize.extraSmall};
        color: ${({ theme }) => theme.color.textSecondary};
      }
    }
  }

  /* 사진 옆이 통째로 비지 않도록 무엇을 하는 자리인지 함께 둔다. */
  .form-photo {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  .form-photo-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }

  .photo-title {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSize.small};
    font-weight: bold;
    color: ${({ theme }) => theme.color.primary};
  }

  .photo-hint {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSize.extraSmall};
    color: ${({ theme }) => theme.color.textSecondary};
    line-height: 1.5;
    word-break: keep-all;
  }

  .form-content {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 0 2rem 2rem 2rem;
    overflow-y: scroll;
    /* 폼 끝까지 스크롤해도 뒤쪽 페이지로 스크롤이 넘어가지 않도록 한다. */
    overscroll-behavior: contain;
    border-radius: ${({ theme }) => theme.borderRadius.default};
    scroll-behavior: smooth;
    backdrop-filter: blur(8px);
  }
`;

export default CardFormModal;
