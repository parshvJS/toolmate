import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

export default function DarkLogo() {
  const { user } = useUser();
  return (
    <>
      <Link to={`${user ? "/dashboard" : "/"}`}>
        <img src="/assets/icons/black-full-logo.svg" alt="Logo" />
      </Link>
    </>
  );
}
