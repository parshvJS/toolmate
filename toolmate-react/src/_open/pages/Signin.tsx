import { SignIn, useUser } from "@clerk/clerk-react";

export default function Signup() {
    const {isSignedIn} = useUser();
    return (
        <div className="my-32  flex justify-center items-center">
            <SignIn
                forceRedirectUrl={'/pricing?redirected=true'}
                signUpUrl="/signup"
            />
        </div>
    );
}