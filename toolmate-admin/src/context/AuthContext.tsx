import React, { createContext, useState, ReactNode } from 'react';


interface eachUser {
    id: string;
    name: string;
    email: string;
    role: [];
}
interface AuthContextProps {
    userData: eachUser;
    isAuth: boolean;
    setIsAuth: (isAuth: boolean) => void;
    setUserData: (userData: eachUser) => void;
}

const initialUserData: eachUser = {
    id: '',
    name: '',
    email: '',
    role: [],
};

const intitialContext = {
    userData: initialUserData,
    isAuth: false,
    setIsAuth: () => { },
    setUserData: () => { },
};

const AuthContext = createContext<AuthContextProps>(intitialContext);

const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [userData, setUserData] = useState<eachUser>(initialUserData);
    const [isAuth, setIsAuth] = useState<boolean>(false);

    return (
        <AuthContext.Provider value={{ userData, isAuth, setIsAuth, setUserData }}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext, AuthProvider };