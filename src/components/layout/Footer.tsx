import styled from "styled-components";
import { FaGithub } from "react-icons/fa";
import QRULogo from "../common/Logo";

const Footer = () => {
  return (
    <StyledFooter>
      <QRULogo size="large" color="primary" />
      <div className="footerMenu">
        <a href="#">About</a>
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
        <a href="#">Contact</a>
      </div>
      <div className="socialIcons">
        <a href="https://github.com/CodingKirby/QRU" target="_blank">
          <FaGithub />
        </a>
      </div>
      <p>© 2024 CodingKirby. All Rights Reserved.</p>
    </StyledFooter>
  );
};

const StyledFooter = styled.footer`
  width: 100%;
  margin-top: auto;
  background: ${({ theme }) => theme.color.blur};
  color: ${({ theme }) => theme.color.onBackground};
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.2);
  justify-content: space-between;

  .footerMenu {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .footerMenu a {
    color: ${({ theme }) => theme.color.onBackground};
    font-size: ${({ theme }) => theme.fontSize.small};
    white-space: nowrap;

    &:hover {
      color: ${({ theme }) => theme.color.onText};
    }
  }

  .socialIcons {
    display: flex;
    gap: 1rem;
  }

  .socialIcons a {
    color: ${({ theme }) => theme.color.onBackground};
    font-size: 1.5rem;
    transition: color 0.3s;

    &:hover {
      color: ${({ theme }) => theme.color.onText};
    }
  }

  p {
    color: ${({ theme }) => theme.color.onBackground};
    font-size: ${({ theme }) => theme.fontSize.small};
    text-align: center;
  }
`;

export default Footer;
