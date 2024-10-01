import { useParams } from "react-router-dom";

export function ChatPage(){
    const {sessionId} = useParams<{sessionId: string}>();
    console.log(sessionId, "sessionId")
    return (
        <div>
            <h1>{sessionId}</h1>
        </div>
    )
}