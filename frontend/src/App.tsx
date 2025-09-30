import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignupPage from "./components/SignUpScreen";
import SigninPage from './components/SignInScreen';
import PrivateRoute from './features/auth/PrivateRoute';
import WelcomeScreen from './components/WelcomeScreen';
import ElderlyDashboard from "./components/ElderlyDashboard";
import AdminDashboard from "./components/AdminDashboard";
import RolesScreen from "./components/RolesScreen";
import { AuthProvider } from './features/auth/authContext';
import AuthSuccess from './features/auth/authsuccess';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path='/auth/success' element={<AuthSuccess />} />
          <Route
            path='/login' element={ <SigninPage/>} />
          <Route
            path='/signup'
            element={
              <SignupPage
                onBack={() => window.history.back()}
              />
            }
          />
          <Route path="roles" element={<RolesScreen />} />
          <Route path="/WelcomeScreen" element={<WelcomeScreen />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}

          <Route element={<PrivateRoute />}>
            <Route
              path="/elderly_dashboard"
              element={
                <ElderlyDashboard/>
              }
            />
            <Route
              path="/admin_dashboard"
              element={
                <AdminDashboard/>
              }
            />
            <Route path="roles" element={<RolesScreen />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
