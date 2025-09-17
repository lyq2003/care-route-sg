import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignupPage from "./components/SignUpScreen";
import SigninPage from './components/SignInScreen';
import PrivateRoute from './features/auth/PrivateRoute';
import ElderlyDashboard from "./components/ElderlyDashboard";
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
          <Route path="/" element={<Index />} />
          <Route path='/auth/success' element={<AuthSuccess />} />
          <Route
            path='/login'
            element={
              <SigninPage
                onBack={() => window.history.back()}
                onSignIn={(credentials) => {
                  // TODO: Implement sign-in logic here
                  console.log('Sign in with', credentials);
                }}
                onGoToSignUp={() => {
                  window.location.href = '/signup';
                }}
              />
            }
          />
          <Route
            path='/signup'
            element={
              <SignupPage
                onBack={() => window.history.back()}
                onSignUpComplete={() => {
                  // TODO: Implement sign-up completion logic here
                  console.log('Sign up complete');
                }}
              />
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}

          <Route element={<PrivateRoute />}>
            <Route
              path="/elderly_home"
              element={
                <ElderlyDashboard
                  user={{ name: "John Doe", userType: "elderly", phone: "12345678" }}
                  onRequestHelp={() => { /* TODO: implement help request */ }}
                  onSmartRoutes={() => { /* TODO: implement smart routes */ }}
                  onSignOut={() => { /* TODO: implement sign out */ }}
                />
              }
            />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
