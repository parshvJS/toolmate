import { createContext, useState, ReactNode, Dispatch, SetStateAction } from "react";

interface UserData {
    planAccess: [boolean, boolean, boolean];
}

interface UserContextType {
    data: UserData;
    setData: Dispatch<SetStateAction<UserData>>;
    id: string;
    setId: Dispatch<SetStateAction<string>>;
}

const initialUserData: UserData = {
    planAccess: [true, false, false],
};

const INITIAL_USER_DATA: UserContextType = {
    data: initialUserData,
    setData: () => {},
    id: "",
    setId: () => {},
};

const UserContext = createContext<UserContextType>(INITIAL_USER_DATA);

function UserContextProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState(initialUserData);
    const [id, setId] = useState("");

    const value = {
        data,
        setData,
        id,
        setId,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export default UserContextProvider;
export { UserContext };
