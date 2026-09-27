import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './main.css'
import App from './App.tsx'
import { VerifyEmail } from './pages/VerifyEmail.tsx'
import { ResetPassword } from './pages/ResetPassword.tsx'
import { NotFound } from './pages/NotFound.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* Root + the app's own in-app views are served by App. */}
        <Route path="/" element={<App />} />
        {/* Any unmatched URL renders the 404 page instead of a blank app or error. */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
