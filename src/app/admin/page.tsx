
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = "admin@sakuralearn.com";

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (email !== ADMIN_EMAIL) {
        throw new Error("This email address does not have admin privileges.");
      }
      await login(email, password);
      toast({
        title: "Admin Login Successful",
        description: "Welcome, administrator!",
      });
      router.push('/');
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Admin Login Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
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
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Enter your administrator credentials.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@sakuralearn.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login as Admin'}
            </Button>
          </form>
        </CardContent>
         <CardContent className="mt-4 text-center text-sm">
            Not an admin?{' '}
            <Link href="/login" className="underline">
              Go to user login
            </Link>
        </CardContent>
      </Card>
    </div>
  );
}
