import { Route, Routes } from "react-router-dom";
import "./App.css";
import OpenLayout from "./_open/OpenLayout";
import Landing from "./_open/pages/Landing";
import PreviewChat from "./_open/pages/PreviewChat";
import Signin from "./_open/pages/Signin";
import Signup from "./_open/pages/Signup";
import DashaboardLayout from "./_private/DashboardLayout";
import Dashboard from "./_private/pages/Dashboard";
import { ChatPage } from "./_private/socket/pages/ChatPage";

function App() {
  return (
    <main className="h-screen w-full font-roboto">
      <Routes>
        {/* route with standard navigation bar inside Open layout componenent */}
        <Route element={<OpenLayout />}>
          <Route index path="/" element={<Landing />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
        {/* preview page can be accessed without authanication but without standard navigation */}
        <Route path="/preview" element={<PreviewChat />} />
        {/* <Route path="/c/:slug" element={<PreviewChat />} /> */}

        {/* private pages */}
        <Route element={<DashaboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/matey/:sessionId" element={<ChatPage />} />
        </Route>
      </Routes>
    </main>
  );
}

export default App;
