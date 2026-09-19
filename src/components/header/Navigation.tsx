import { ISubItem } from "../../types/navigationType";
import { NAVIGATION } from "../../data/navigation";
import Dropdown from "../common/Dropdown";
import { styled } from "styled-components";
import { HashLink } from "react-router-hash-link";

function Navigation() {
  return (
    <StyledNavigation>
      <ul>
        {NAVIGATION.map((item, index) => (
          <li key={index}>
            <HashLink smooth to={item.link}>
              {item.title}
            </HashLink>
            {item.subItems && (
              <Dropdown className="navigation-dropdown">
                {item.subItems.map((subItem: ISubItem, subIndex: number) => (
                  <HashLink
                    smooth
                    to={subItem.link}
                    key={subIndex}
                    className="item"
                  >
                    {subItem.title}
                  </HashLink>
                ))}
              </Dropdown>
            )}
          </li>
        ))}
      </ul>
    </StyledNavigation>
  );
}

const StyledNavigation = styled.nav`
  ul {
    display: flex;
    gap: 1rem;
    white-space: nowrap;

    li {
      position: relative;

      a {
        font-size: ${({ theme }) => theme.fontSize.medium};
        font-weight: 500;
        color: ${({ theme }) => theme.color.text};
        text-decoration: none;
        transition: color 0.3s ease;

        &:hover {
          color: ${({ theme }) => theme.color.primary};
        }
      }

      &:hover .navigation-dropdown {
        visibility: visible;
        opacity: 1;
        transform: scaleY(1);
      }

      .navigation-dropdown {
        visibility: hidden;
        position: absolute;
        top: calc(100% + 1rem);
        left: 0;

        opacity: 0;
        transform-origin: top;
        transform: scaleY(0);
        display: flex;
        flex-direction: column;
        transition: all 0.3s ease;

        .panel {
          display: flex;
          flex-direction: column;

          position: relative;
          top: 100%;
          padding: 1rem 1.2rem;
          line-height: 2;

          background: ${({ theme }) => theme.color.surface};
          border-radius: ${({ theme }) => theme.borderRadius.default};
          box-shadow: ${({ theme }) => theme.shadow.default};

          .item {
            font-size: ${({ theme }) => theme.fontSize.medium};
            color: ${({ theme }) => theme.color.text};
            text-decoration: none;
            transition: color 0.3s ease;
            border-radius: ${({ theme }) => theme.borderRadius.default};
            padding: 0.3rem 1rem;

            &:hover {
              color: ${({ theme }) => theme.color.primary};
              background: ${({ theme }) => theme.color.secondary};
              box-shadow: ${({ theme }) => theme.shadow.default};
            }
          }
        }

        /* 화살표 */
        &:before {
          content: "";
          position: absolute;
          width: 0;
          height: 0.5rem;
          border-left: 0.5rem solid transparent;
          border-right: 0.5rem solid transparent;
          border-bottom: 0.5rem solid ${({ theme }) => theme.color.surface};
          top: -0.5rem;
          left: 2rem;
        }

        &:after {
          content: "";
          position: absolute;
          top: -1rem;
          left: 0;
          width: 100%;
          height: 2rem;
          background: none;
        }
      }
    }
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

export default Navigation;
