import { useCallback, useMemo, useReducer, useRef } from "react";
import { FORM_FIELDS, MAX_CUSTOM_FIELDS, buildCardFields } from "../data/formFields";
import { FormErrors, FormValues, FormVisibility, IFormSubmit } from "../types/formType";
import { customFieldIdsOf } from "../utils/cardUtil";
import { createInitialVisibility, deriveValues, omitKey, omitKeys } from "../utils/formUtil";
import {
  collectValues,
  collectVisibility,
  validateForm,
  validateValue,
} from "../utils/formValidation";

interface CardFormState {
  values: FormValues;
  isPublic: FormVisibility;
  errors: FormErrors;
  customFieldIds: string[];
  /** 추가 항목 id 를 만들 때 쓰는 일련번호 */
  customFieldSeq: number;
  /** 랜덤 셔플 결과에 노출할지 */
  inShuffle: boolean;
  /** 줄여서 담은 JPEG 데이터 URL. 없으면 사진 없음 */
  photo: string | null;
}

type CardFormAction =
  | { type: "changeValue"; id: string; value: string }
  | { type: "changeVisibility"; id: string; isPublic: boolean }
  | { type: "blurField"; id: string }
  | { type: "setErrors"; errors: FormErrors }
  | { type: "addCustomField" }
  | { type: "removeCustomField"; id: string }
  | { type: "changeShuffle"; inShuffle: boolean }
  | { type: "changePhoto"; photo: string | null }
  | { type: "reset"; initial?: CardFormInitial };

/** 이미 저장된 명함을 고칠 때 폼을 채울 값 */
export interface CardFormInitial {
  values: FormValues;
  isPublic: FormVisibility;
  inShuffle: boolean;
  photo: string | null;
}

/**
 * 이어 붙일 다음 일련번호.
 *
 * 불러온 값에 custom_3 까지 있는데 0 부터 다시 매기면 새로 추가한 항목이
 * 기존 항목을 덮어쓴다. 가장 큰 번호 다음부터 시작한다.
 */
const nextCustomSeq = (customFieldIds: string[]): number =>
  customFieldIds.reduce(
    (max, id) => Math.max(max, Number(id.split("_")[1]) || 0),
    0
  );

const createInitialState = (initial?: CardFormInitial): CardFormState => {
  if (!initial) {
    return {
      values: {},
      isPublic: createInitialVisibility(FORM_FIELDS),
      errors: {},
      customFieldIds: [],
      customFieldSeq: 0,
      // README 의 excludeFromShuffle 처럼 기본은 노출이고 원하면 끈다.
      inShuffle: true,
      photo: null,
    };
  }

  const customFieldIds = customFieldIdsOf(initial.values);

  return {
    values: initial.values,
    isPublic: initial.isPublic,
    errors: {},
    customFieldIds,
    customFieldSeq: nextCustomSeq(customFieldIds),
    inShuffle: initial.inShuffle,
    photo: initial.photo,
  };
};

const reducer = (state: CardFormState, action: CardFormAction): CardFormState => {
  switch (action.type) {
    case "changeValue": {
      const values = {
        ...state.values,
        [action.id]: action.value,
        ...deriveValues(action.id, action.value),
      };

      // 입력을 시작하면 해당 필드의 에러는 즉시 걷어낸다.
      return { ...state, values, errors: omitKey(state.errors, action.id) };
    }

    case "changeVisibility":
      return {
        ...state,
        isPublic: { ...state.isPublic, [action.id]: action.isPublic },
      };

    case "blurField": {
      const fields = buildCardFields(state.customFieldIds);
      const message = validateValue(fields, state.values, state.isPublic, action.id);

      if (!message) {
        if (!(action.id in state.errors)) return state;
        return { ...state, errors: omitKey(state.errors, action.id) };
      }

      if (state.errors[action.id] === message) return state;
      return { ...state, errors: { ...state.errors, [action.id]: message } };
    }

    case "setErrors":
      return { ...state, errors: action.errors };

    case "addCustomField": {
      if (state.customFieldIds.length >= MAX_CUSTOM_FIELDS) return state;

      const seq = state.customFieldSeq + 1;
      const newId = `custom_${seq}`;

      return {
        ...state,
        customFieldIds: [...state.customFieldIds, newId],
        customFieldSeq: seq,
        // 직접 추가한 항목은 공개를 전제로 한다.
        isPublic: { ...state.isPublic, [newId]: true },
      };
    }

    case "removeCustomField":
      // 삭제한 항목의 값/공개설정/에러가 남아 제출되지 않도록 함께 정리한다.
      return {
        ...state,
        customFieldIds: state.customFieldIds.filter((id) => id !== action.id),
        values: omitKeys(state.values, action.id),
        isPublic: omitKeys(state.isPublic, action.id),
        errors: omitKeys(state.errors, action.id),
      };

    case "changeShuffle":
      return { ...state, inShuffle: action.inShuffle };

    case "changePhoto":
      return { ...state, photo: action.photo };

    case "reset":
      return createInitialState(action.initial);

    default:
      return state;
  }
};

/**
 * 명함 폼의 상태와 검증을 담당한다.
 *
 * initial 을 주면 그 값으로 시작한다. 수정 화면에서 쓴다.
 * 첫 렌더에서만 읽으므로, 불러오기가 끝난 뒤에 마운트해야 한다.
 */
export const useCardForm = (initial?: CardFormInitial) => {
  const [state, dispatch] = useReducer(reducer, initial, createInitialState);

  // reset 이 매번 새 함수가 되지 않도록 최초 값을 붙들어 둔다.
  const initialRef = useRef(initial);

  const fields = useMemo(
    () => buildCardFields(state.customFieldIds),
    [state.customFieldIds]
  );

  const changeValue = useCallback((id: string, value: string) => {
    dispatch({ type: "changeValue", id, value });
  }, []);

  const changeVisibility = useCallback((id: string, isPublic: boolean) => {
    dispatch({ type: "changeVisibility", id, isPublic });
  }, []);

  const changeShuffle = useCallback((inShuffle: boolean) => {
    dispatch({ type: "changeShuffle", inShuffle });
  }, []);

  const changePhoto = useCallback((photo: string | null) => {
    dispatch({ type: "changePhoto", photo });
  }, []);

  const blurField = useCallback((id: string) => {
    dispatch({ type: "blurField", id });
  }, []);

  const addCustomField = useCallback(() => {
    dispatch({ type: "addCustomField" });
  }, []);

  const removeCustomField = useCallback((id: string) => {
    dispatch({ type: "removeCustomField", id });
  }, []);

  /** 처음 상태로 되돌린다. 수정 화면에서는 불러온 값으로 돌아간다. */
  const reset = useCallback(() => {
    dispatch({ type: "reset", initial: initialRef.current });
  }, []);

  /** 전체 검증 후 에러 맵을 반영하고 그대로 돌려준다. */
  const validate = useCallback((): FormErrors => {
    const errors = validateForm(fields, state.values, state.isPublic);
    dispatch({ type: "setErrors", errors });
    return errors;
  }, [fields, state.values, state.isPublic]);

  /** 화면에 살아 있는 값만 추려서 제출 형태로 만든다. */
  const getSubmitData = useCallback(
    (): IFormSubmit => ({
      values: collectValues(fields, state.values),
      isPublic: collectVisibility(fields, state.values, state.isPublic),
    }),
    [fields, state.values, state.isPublic]
  );

  return {
    fields,
    values: state.values,
    isPublic: state.isPublic,
    errors: state.errors,
    customFieldCount: state.customFieldIds.length,
    inShuffle: state.inShuffle,
    photo: state.photo,
    canAddCustomField: state.customFieldIds.length < MAX_CUSTOM_FIELDS,
    changeValue,
    changeVisibility,
    changeShuffle,
    changePhoto,
    blurField,
    addCustomField,
    removeCustomField,
    reset,
    validate,
    getSubmitData,
  };
};

export type CardFormController = ReturnType<typeof useCardForm>;
