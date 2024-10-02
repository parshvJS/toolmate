import { useAuth, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

export default function LogoSmall() {
    const { user } = useUser();
    return (
        <>
            <Link to={`${user ? "/dashboard" : "/"}`}>
                <img src="/assets/icons/small-logo.svg" alt="Logo" />{" "}
            </Link>
        </>
    );
}