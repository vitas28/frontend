import { Link as RLink } from "react-router-dom";
import styled from "styled-components";

const Link = styled(RLink)`
  color: ${({ theme }) => theme.colors.secondary};
  & path {
    fill: ${({ theme }) => theme.colors.secondary};
  }
  :hover {
    color: ${({ theme }) => theme.colors.primary};
    & path {
      fill: ${({ theme }) => theme.colors.primary};
    }
  }
`;

const TextStyledLink = styled.div`
  cursor: pointer;
  color: ${({ theme }) => theme.colors.secondary};
  & path {
    fill: ${({ theme }) => theme.colors.secondary};
  }
  :hover {
    color: ${({ theme }) => theme.colors.primary};
    & path {
      fill: ${({ theme }) => theme.colors.primary};
    }
  }
  text-decoration: underline;
`;

export { Link, TextStyledLink };
