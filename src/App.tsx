import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'
import { ProtectedRoute } from './components/shared/ProtectedRoute'
import { StatePanel } from './components/ui/StatePanel'
import { Legal } from './pages/Legal'
import { useAuth } from './context/AuthContext'

const Home = lazy(() => import('./pages/Home'))
const Services = lazy(() => import('./pages/Services'))
const Solutions = lazy(() => import('./pages/Solutions'))
const SolutionDetail = lazy(() => import('./pages/SolutionDetail'))
const Templates = lazy(() => import('./pages/Templates'))
const TemplateDetail = lazy(() => import('./pages/TemplateDetail'))
const Portfolio = lazy(() => import('./pages/Portfolio'))
const About = lazy(() => import('./pages/About'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const Pricing = lazy(() => import('./pages/Pricing'))
const Contact = lazy(() => import('./pages/Contact'))
const Login = lazy(() => import('./pages/Auth/Login'))
const Register = lazy(() => import('./pages/Auth/Register'))
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'))
const DashboardLayout = lazy(() => import('./pages/Dashboard/DashboardLayout'))
const DashboardHome = lazy(() => import('./pages/Dashboard/DashboardHome'))
const MyProjects = lazy(() => import('./pages/Dashboard/MyProjects'))
const MyTemplates = lazy(() => import('./pages/Dashboard/MyTemplates'))
const NewRequest = lazy(() => import('./pages/Dashboard/NewRequest'))
const Messages = lazy(() => import('./pages/Dashboard/Messages'))
const Activity = lazy(() => import('./pages/Dashboard/Activity'))
const PrototypeStudio = lazy(() => import('./pages/Dashboard/PrototypeStudio'))
const AdminConsole = lazy(() => import('./pages/Dashboard/AdminConsole'))
const Settings = lazy(() => import('./pages/Dashboard/Settings'))
const NotFound = lazy(() => import('./pages/NotFound'))
const BusinessSystems = lazy(() => import('./pages/Dashboard/BusinessSystems'))
const BusinessSite = lazy(() => import('./pages/BusinessSite'))

function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  )
}
function AdminOnly() {
  const { admin } = useAuth()
  return admin ? <AdminConsole /> : <Navigate to="/dashboard" replace />
}
export default function App() {
  const location = useLocation()
  useEffect(() => {
    if (!location.pathname.startsWith('/dashboard/studio'))
      window.scrollTo(0, 0)
  }, [location.pathname])
  return (
    <Suspense fallback={<StatePanel loading />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route
            path="/"
            element={
              import.meta.env.VITE_APP_ONLY === 'true' ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Home />
              )
            }
          />
          <Route path="/services" element={<Services />} />
          <Route path="/solutions" element={<Solutions />} />
          <Route path="/solutions/:slug" element={<SolutionDetail />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/templates/:slug" element={<TemplateDetail />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Legal kind="Privacy Policy" />} />
          <Route path="/terms" element={<Legal kind="Terms" />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/b/:id" element={<BusinessSite />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard/admin" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quote"
          element={
            <Navigate
              to={`/dashboard/requests/new${location.search}`}
              replace
            />
          }
        />
        <Route
          path="/app/*"
          element={
            <Navigate
              to={`/dashboard${location.pathname.slice(4)}${location.search}`}
              replace
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route
            path="projects"
            element={<Navigate to="/dashboard/requests" replace />}
          />
          <Route path="requests" element={<MyProjects />} />
          <Route path="requests/new" element={<NewRequest />} />
          <Route path="requests/:id" element={<MyProjects />} />
          <Route path="messages" element={<Messages />} />
          <Route path="activity" element={<Activity />} />
          <Route path="studio" element={<PrototypeStudio />} />
          <Route path="businesses" element={<BusinessSystems />} />
          <Route path="templates" element={<MyTemplates />} />
          <Route path="admin" element={<AdminOnly />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
