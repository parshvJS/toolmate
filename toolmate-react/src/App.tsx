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
import { ChatPageNew } from "./_private/socket/pages/ChatPageNew";
import SocketProvider from "./context/socketContext";
import { SocketLayout } from "./_private/socket/SocketLayout";
import { Toaster } from "./components/ui/toaster";
import { ExploreCommunity } from "./_private/pages/ExploreCommunity";
import { MyCommunity } from "./_private/pages/MyCommunity";
import { CommunityCreationForm } from "./components/custom/CommunityCreationForm";
import { useUser } from "@clerk/clerk-react";
import MyInventory from "./_private/pages/MyInventory";
import Pricing from "./_open/pages/Pricing";
import SuccessPayment from "./_private/pages/SuccessPayment";

function App() {
  const { user } = useUser()
  console.log(user, "user")
  return (
    <main className="h-screen w-full font-roboto">
      <Routes>
        {/* Routes with standard navigation bar inside Open layout component */}
        <Route element={<OpenLayout />}>
          <Route index path="/" element={<Landing />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/success" element={<SuccessPayment />} />
        </Route>

        {/* Preview page can be accessed without authentication but without standard navigation */}
        <Route path="/preview" element={<PreviewChat />} />

        {/* Private pages */}
        <Route element={<DashaboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/explore-community" element={<ExploreCommunity />} />
          <Route path="/my-community" element={<MyCommunity />} />
          <Route path="/createCommunity" element={<CommunityCreationForm />} />
          <Route path="/my-inventory" element={<MyInventory />} />

          {/* Wrap the routes that need the SocketProvider */}
          <Route element={<SocketLayout />}>
            <Route path="/matey/:sessionId" element={<ChatPage />} />
            <Route path="/c" element={<ChatPageNew />} />
          </Route>
        </Route>
      </Routes>

      <Toaster />

    </main>
  );
}

export default App;
