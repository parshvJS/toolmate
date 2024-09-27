import { SignIn } from "@clerk/clerk-react";

export default function Signup() {
    return (
        <div className="my-32  flex justify-center items-center">
            <SignIn
                forceRedirectUrl={'/dashboard'}
                signUpUrl="/signup"
            />
        </div>
    );
}