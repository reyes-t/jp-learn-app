
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { Languages, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PasswordStrengthIndicator = ({ strength }: { strength: number }) => {
  const levels = [
    { width: '20%', color: 'bg-red-500', label: 'Very Weak' },
    { width: '40%', color: 'bg-red-500', label: 'Weak' },
    { width: '60%', color: 'bg-orange-500', label: 'Medium' },
    { width: '80%', color: 'bg-yellow-500', label: 'Strong' },
    { width: '100%', color: 'bg-green-500', label: 'Very Strong' },
  ];

  const currentLevel = levels[strength];

  return (
    <div className="space-y-2">
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-300", currentLevel?.color)}
          style={{ width: currentLevel?.width || '0%' }}
        />
      </div>
      <p className="text-xs text-right text-muted-foreground">
        {currentLevel?.label}
      </p>
    </div>
  );
};


export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (!password) return -1;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    if (password.length > 12) score++;
    
    // Scale score to 0-4 range for the indicator
    if (score <= 1) return 0; // Very Weak
    if (score === 2) return 1; // Weak
    if (score === 3) return 2; // Medium
    if (score === 4) return 3; // Strong
    if (score >= 5) return 4; // Very Strong
    return 0;
  }, [password]);


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
        toast({
            title: "Name is required",
            description: "Please enter your name.",
            variant: "destructive",
        });
        return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register(email, password, name);
      router.push('/');
    } catch (error) {
      // Error is already handled by the useAuth hook (toast message)
      // We just need to stop loading.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
         <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
               <Languages className="size-10 text-primary" />
                <h1 className="text-3xl font-bold font-headline text-primary-foreground">SakuraLearn</h1>
            </div>
          <CardTitle>Register</CardTitle>
          <CardDescription>Create a new account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 h-full px-3 flex items-center justify-center text-muted-foreground"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                </Button>
              </div>
               {password.length > 0 && <PasswordStrengthIndicator strength={passwordStrength} />}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
               <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 h-full px-3 flex items-center justify-center text-muted-foreground"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showConfirmPassword ? 'Hide password' : 'Show password'}</span>
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Register'}
            </Button>
          </form>
        </CardContent>
        <CardContent className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Login
            </Link>
        </CardContent>
      </Card>
    </div>
  );
}
