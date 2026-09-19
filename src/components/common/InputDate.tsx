import DatePicker from "react-datepicker";
import styled from "styled-components";
import "react-datepicker/dist/react-datepicker.css";
import { parseISODate, toISODate } from "../../utils/dateUtil";

interface Props {
  id?: string;
  label?: string;
  /** "yyyy-MM-dd" 형식의 값. 빈 문자열이면 선택되지 않은 상태 */
  value: string;
  /** 선택이 해제되면 빈 문자열이 전달된다. */
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
}

const InputDate = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder = "날짜를 선택하세요",
}: Props) => (
  <StyledInputDate>
    {label && <label htmlFor={id}>{label}</label>}
    <DatePicker
      id={id}
      selected={parseISODate(value)}
      onChange={(date) => onChange(date ? toISODate(date) : "")}
      showYearDropdown
      yearDropdownItemNumber={130}
      scrollableYearDropdown
      dateFormat="yyyy-MM-dd"
      placeholderText={placeholder}
      className="custom-datepicker"
      closeOnScroll
      shouldCloseOnSelect
      maxDate={new Date()}
      onBlur={onBlur}
    />
  </StyledInputDate>
);

const StyledInputDate = styled.div`
  display: flex;
  flex-direction: column;
  z-index: 1000;

  label {
    margin-left: 0.5rem;
    font-size: ${({ theme }) => theme.fontSize.extraSmall};
    color: ${({ theme }) => theme.color.text};
  }

  .custom-datepicker {
    width: 100%;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: ${({ theme }) => theme.borderRadius.default};
    background-color: ${({ theme }) => theme.color.blur};
    font-size: ${({ theme }) => theme.fontSize.small};
    color: ${({ theme }) => theme.color.text};
    box-shadow: ${({ theme }) => theme.shadow.light};
    outline: none;

    &::placeholder {
      color: ${({ theme }) => theme.color.textSecondary};
    }

    &:hover {
      border-color: ${({ theme }) => theme.color.primary};
    }

    &:focus {
      border-color: ${({ theme }) => theme.color.primary};
      box-shadow: ${({ theme }) => theme.shadow.default};
    }
  }

  .react-datepicker__header {
    background-color: ${({ theme }) => theme.color.primary};
    color: ${({ theme }) => theme.color.onPrimary};
    border-bottom: none;
  }

  .react-datepicker__current-month,
  .react-datepicker-time__header {
    font-size: ${({ theme }) => theme.fontSize.medium};
  }

  .react-datepicker__day--selected,
  .react-datepicker__day--keyboard-selected {
    background-color: ${({ theme }) => theme.color.secondary};
    color: ${({ theme }) => theme.color.onSecondary};
    border-radius: ${({ theme }) => theme.borderRadius.default};
  }

  .react-datepicker__day:hover {
    background-color: ${({ theme }) => theme.color.primaryVariant};
    color: ${({ theme }) => theme.color.onPrimary};
  }

  .react-datepicker__year-dropdown,
  .react-datepicker__month-dropdown {
    background-color: ${({ theme }) => theme.color.surface};
    color: ${({ theme }) => theme.color.text};
    border: 1px solid ${({ theme }) => theme.color.secondary};
  }

  .react-datepicker__year-option:hover,
  .react-datepicker__month-option:hover {
    background-color: ${({ theme }) => theme.color.primary};
    color: ${({ theme }) => theme.color.onPrimary};
  }
`;

export default InputDate;
