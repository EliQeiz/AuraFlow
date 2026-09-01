import { AnimatePresence } from 'framer-motion'
import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'
import { CustomCursor } from './components/shared/CustomCursor'
import { EasterEgg } from './components/shared/EasterEgg'
import { LoadingScreen } from './components/shared/LoadingScreen'
import { ProtectedRoute } from './components/shared/ProtectedRoute'
import { ScrollToTop } from './components/shared/ScrollToTop'
import { WhatsAppButton } from './components/shared/WhatsAppButton'
import { Skeleton } from './components/ui/Skeleton'
import { Legal } from './pages/Legal'

const Home = lazy(() => import('./pages/Home'))
const Services = lazy(() => import('./pages/Services'))
const Solutions = lazy(() => import('./pages/Solutions'))
const Templates = lazy(() => import('./pages/Templates'))
const TemplateDetail = lazy(() => import('./pages/TemplateDetail'))
const Portfolio = lazy(() => import('./pages/Portfolio'))
const About = lazy(() => import('./pages/About'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const Pricing = lazy(() => import('./pages/Pricing'))
const Contact = lazy(() => import('./pages/Contact'))
const GetQuote = lazy(() => import('./pages/GetQuote'))
const Login = lazy(() => import('./pages/Auth/Login'))
const Register = lazy(() => import('./pages/Auth/Register'))
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'))
const DashboardLayout = lazy(() => import('./pages/Dashboard/DashboardLayout'))
const DashboardHome = lazy(() => import('./pages/Dashboard/DashboardHome'))
const MyProjects = lazy(() => import('./pages/Dashboard/MyProjects'))
const MyTemplates = lazy(() => import('./pages/Dashboard/MyTemplates'))
const NewRequest = lazy(() => import('./pages/Dashboard/NewRequest'))
const Messages = lazy(() => import('./pages/Dashboard/Messages'))
const PrototypeStudio = lazy(() => import('./pages/Dashboard/PrototypeStudio'))
const AdminConsole = lazy(() => import('./pages/Dashboard/AdminConsole'))
const Settings = lazy(() => import('./pages/Dashboard/Settings'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')

  return (
    <>
      <LoadingScreen />
      {!isDashboard ? <Navbar /> : null}
      <Suspense fallback={<PageFallback />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/templates/:slug" element={<TemplateDetail />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/quote"
              element={
                <ProtectedRoute>
                  <GetQuote />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/privacy" element={<Legal kind="Privacy Policy" />} />
            <Route path="/terms" element={<Legal kind="Terms" />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="projects" element={<MyProjects />} />
              <Route path="requests" element={<MyProjects />} />
              <Route path="requests/new" element={<NewRequest />} />
              <Route path="messages" element={<Messages />} />
              <Route path="studio" element={<PrototypeStudio />} />
              <Route path="templates" element={<MyTemplates />} />
              <Route path="admin" element={<AdminConsole />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
      {!isDashboard ? <Footer /> : null}
      {!isDashboard ? <ScrollToTop /> : null}
      {!isDashboard ? <WhatsAppButton /> : null}
      <EasterEgg />
      <CustomCursor />
    </>
  )
}

function PageFallback() {
  return (
    <div className="section-shell min-h-screen pt-32">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="mt-6 h-96 w-full" />
    </div>
  )
}
