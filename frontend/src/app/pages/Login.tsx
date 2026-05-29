import { useState } from "react";
import { useNavigate } from "react-router";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { Shield } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { auth } from "../../lib/firebase";
import { API_BASE_URL } from "../../config/api";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const success = await login(email, password);

    if (!success) {
      toast.error("Invalid credentials");
      return;
    }

    // GET FIREBASE TOKEN
    const token = await auth.currentUser?.getIdToken();

    // SEND TOKEN TO BACKEND
    const response = await fetch(`${API_BASE_URL}/auth/sync-user`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
});

    const data = await response.json();

    console.log(data);
    
    const customersResponse = await fetch(
  `${API_BASE_URL}/customers`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const customersData = await customersResponse.json();

console.log(customersData);

    if (response.ok) {
      toast.success("Login successful!");
      navigate("/");
    } else {
      toast.error("Backend authentication failed");
    }
  } catch (error) {
    console.log(error);
    toast.error("Login failed");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary-dark to-accent p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-white max-w-md">
          <h2 className="text-4xl font-semibold mb-6">
            Secure Tax Operations Management
          </h2>
          <p className="text-lg text-white/90 mb-8">
            Streamline your tax filing workflow with our premium enterprise-grade admin platform.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-medium">Enterprise Security</h4>
                <p className="text-sm text-white/80">Bank-grade encryption & compliance</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <FileTextIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-medium">Complete Filing Management</h4>
                <p className="text-sm text-white/80">Track every stage seamlessly</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-text-dark">D Tax Rail</h1>
                <p className="text-sm text-text-light">Admin Access</p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-text-dark mb-2">Welcome Back</h2>
              <p className="text-text-mid">Secure admin access to tax operations</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@dtaxrail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 h-12 rounded-xl bg-secondary border-0"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 h-12 rounded-xl bg-secondary border-0"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                    Remember me
                  </Label>
                </div>
                
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-8 flex items-center justify-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-text-light">Secured by enterprise-grade encryption</span>
            </div>
          </div>

          <p className="text-center text-sm text-text-light mt-6">
            © 2026 D Tax Rail. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}
