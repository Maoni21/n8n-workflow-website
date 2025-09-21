// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import GoogleCallback from './pages/GoogleCallback.jsx'
import FacebookCallback from './pages/FacebookCallback.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/oauth/callback/google" element={<GoogleCallback />} />
                <Route path="/oauth/callback/facebook" element={<FacebookCallback />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>,
)