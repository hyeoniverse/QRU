import { useCallback, useMemo, useReducer } from "react";
import { FORM_FIELDS, MAX_CUSTOM_FIELDS, buildCardFields } from "../data/formFields";
import { FormErrors, FormValues, FormVisibility, IFormSubmit } from "../types/formType";
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
}

type CardFormAction =
  | { type: "changeValue"; id: string; value: string }
  | { type: "changeVisibility"; id: string; isPublic: boolean }
  | { type: "blurField"; id: string }
  | { type: "setErrors"; errors: FormErrors }
  | { type: "addCustomField" }
  | { type: "removeCustomField"; id: string }
  | { type: "reset" };

const createInitialState = (): CardFormState => ({
  values: {},
  isPublic: createInitialVisibility(FORM_FIELDS),
  errors: {},
  customFieldIds: [],
  customFieldSeq: 0,
});

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

    case "reset":
      return createInitialState();

    default:
      return state;
  }
};

/** 명함 생성 폼의 상태와 검증을 담당한다. */
export const useCardForm = () => {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

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

  const blurField = useCallback((id: string) => {
    dispatch({ type: "blurField", id });
  }, []);

  const addCustomField = useCallback(() => {
    dispatch({ type: "addCustomField" });
  }, []);

  const removeCustomField = useCallback((id: string) => {
    dispatch({ type: "removeCustomField", id });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "reset" });
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
    canAddCustomField: state.customFieldIds.length < MAX_CUSTOM_FIELDS,
    changeValue,
    changeVisibility,
    blurField,
    addCustomField,
    removeCustomField,
    reset,
    validate,
    getSubmitData,
  };
};

export type CardFormController = ReturnType<typeof useCardForm>;
