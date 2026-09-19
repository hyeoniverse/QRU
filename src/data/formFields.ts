import { IFormField, IOption } from "../types/formType";
import { SELF_VALUE } from "../utils/formUtil";

/** 사용자가 직접 추가할 수 있는 항목 수 */
export const MAX_CUSTOM_FIELDS = 5;

/** 추가 항목의 제목 선택지 */
export const CUSTOM_FIELD_OPTIONS: IOption[] = [
  { label: "소속/회사", value: "company" },
  { label: "직무/직책", value: "position" },
  { label: "연락처", value: "contact" },
  { label: "웹사이트", value: "website" },
  { label: "활동 지역", value: "region" },
  { label: "관심 분야", value: "interest" },
  { label: "좌우명", value: "motto" },
  { label: "한마디", value: "message" },
  { label: "직접 입력", value: SELF_VALUE },
];

export const FORM_FIELDS: IFormField[] = [
  {
    required: true,
    id: "bio",
    group: "기본 정보",
    label: "한 줄 자기소개",
    type: "text",
    placeholder: "자신을 표현할 수 있는 문구를 입력해주세요.",
    minLength: 5,
    maxLength: 80,
  },
  {
    required: true,
    id: "name",
    span: "half",
    label: "이름",
    type: "text",
    placeholder: "이름을 입력하세요.",
    minLength: 2,
    maxLength: 20,
  },
  {
    required: true,
    id: "gender",
    span: "half",
    label: "성별",
    type: "select",
    options: [
      { label: "여성", value: "female" },
      { label: "남성", value: "male" },
      { label: "기타", value: "other" },
    ],
  },
  {
    // 생년월일 자체는 공개하지 않고, 생일/나이만 골라서 공개한다.
    required: true,
    publishable: false,
    id: "birth",
    label: "생년월일",
    type: "date",
    subFields: [
      {
        id: "birthday",
        span: "half",
        label: "생일",
        type: "text",
        placeholder: "자동으로 채워집니다",
        readOnly: true,
      },
      {
        id: "age",
        span: "half",
        label: "나이",
        type: "number",
        placeholder: "자동으로 채워집니다",
        readOnly: true,
      },
    ],
  },
  {
    id: "email",
    group: "연락처",
    label: "이메일",
    type: "email",
    placeholder: "이메일을 입력하세요.",
    minLength: 5,
    maxLength: 50,
  },
  {
    // SNS 는 종류와 아이디가 한 쌍이므로 아이디 쪽에서만 공개 여부를 고른다.
    publishable: false,
    id: "sns",
    label: "SNS",
    type: "select",
    options: [
      { label: "인스타그램", value: "instagram" },
      { label: "깃허브", value: "github" },
      { label: "링크드인", value: "linkedin" },
      { label: "유튜브", value: "youtube" },
      { label: "트위터", value: "twitter" },
      { label: "페이스북", value: "facebook" },
      { label: "틱톡", value: "tiktok" },
      { label: "디스코드", value: "discord" },
      { label: "카카오톡", value: "kakao" },
      { label: "직접 입력", value: SELF_VALUE },
    ],
    subFields: [
      {
        id: "id",
        label: "아이디",
        type: "text",
        placeholder: "아이디를 입력하세요.",
        minLength: 2,
        maxLength: 50,
      },
    ],
  },
  {
    id: "mbti",
    group: "나를 소개하는 것",
    span: "half",
    label: "MBTI",
    type: "select",
    options: [
      { label: "ISTP", value: "istp" },
      { label: "ISFP", value: "isfp" },
      { label: "ISTJ", value: "istj" },
      { label: "ISFJ", value: "isfj" },
      { label: "INTP", value: "intp" },
      { label: "INFP", value: "infp" },
      { label: "INTJ", value: "intj" },
      { label: "INFJ", value: "infj" },
      { label: "ESTP", value: "estp" },
      { label: "ESFP", value: "esfp" },
      { label: "ESTJ", value: "estj" },
      { label: "ESFJ", value: "esfj" },
      { label: "ENTP", value: "entp" },
      { label: "ENFP", value: "enfp" },
      { label: "ENTJ", value: "entj" },
      { label: "ENFJ", value: "enfj" },
    ],
  },
  {
    id: "hobby",
    suggestions: [
      "등산", "독서", "영화", "음악 감상", "게임", "운동",
      "요리", "여행", "사진", "카페 투어", "그림", "코딩",
    ],
    label: "취미/관심사",
    type: "text",
    placeholder: "취미를 입력하세요.",
    minLength: 1,
    maxLength: 120,
  },
  {
    id: "likes",
    suggestions: [
      "커피", "강아지", "고양이", "바다", "산", "야식",
      "음악", "여행", "운동", "영화", "빵", "맥주",
    ],
    label: "좋아하는 것",
    type: "text",
    placeholder: "좋아하는 것을 입력하세요.",
    minLength: 1,
    maxLength: 120,
  },
  {
    id: "dislikes",
    suggestions: [
      "지각", "벌레", "매운 음식", "소음", "월요일",
      "추위", "더위", "기다리는 것", "막히는 길",
    ],
    label: "싫어하는 것",
    type: "text",
    placeholder: "싫어하는 것을 입력하세요.",
    minLength: 1,
    maxLength: 120,
  },
];

/** 사용자가 추가한 항목을 폼 필드로 변환 */
export const createCustomField = (id: string): IFormField => ({
  id,
  label: "추가 정보",
  type: "custom",
  required: true,
  options: CUSTOM_FIELD_OPTIONS,
  minLength: 1,
  maxLength: 200,
});

/** 기본 항목 + 추가 항목 */
export const buildCardFields = (customFieldIds: string[]): IFormField[] => [
  ...FORM_FIELDS,
  ...customFieldIds.map(createCustomField),
];
