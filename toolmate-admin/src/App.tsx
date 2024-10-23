import { Route, Routes } from 'react-router-dom';
import { PublicLayout } from './pages/_public/PublicLayout';
import LogIn from './pages/_public/page/Login';



function App() {
  return (
     <div className='h-screen w-screen'>
       <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route path="/login" element={<LogIn />} />
        </Route>
        {/* <Route path="/dashboard" element={<PrivateLayout />}>
          <Route index element={<DashboardPage />} />
        </Route> */}
      </Routes>
     </div>

  )
}

export default App;