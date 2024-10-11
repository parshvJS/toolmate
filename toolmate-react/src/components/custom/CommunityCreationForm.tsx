import { ICommunityForm } from "@/types/types";
import { useState } from "react";
const inititalFormData:ICommunityForm = {
    name: '',
    description: '',
    tags: '',
    profileImage: '',
    profileImageParams: '',
    city: '',
    country: '',
    sponsored: false
}

export function CommunityCreationForm() {
    const [formData,setFormData] = useState<ICommunityForm>(inititalFormData);
    return (
        <div>
            <h1>Create Community</h1>
        </div>
    );
}