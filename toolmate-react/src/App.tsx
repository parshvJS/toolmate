import { Route, Routes } from "react-router-dom";
import "./App.css";
import OpenLayout from "./_open/OpenLayout";
import Landing from "./_open/pages/Landing";
import PreviewChat from "./_open/pages/PreviewChat";
import Signin from "./_open/pages/Signin";
import Signup from "./_open/pages/Signup";

function App() {
  return (
    <main className="h-screen w-full font-roboto">
      <Routes>
        {/* route with standard navigation bar inside Open layout componenent */}
        <Route element={<OpenLayout />}>
          <Route index element={<Landing />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
        {/* preview page can be accessed without authanication but without standard navigation */}
        <Route path="/preview" element={<PreviewChat />} />
      </Routes>
    </main>
  );
}

export default App;
