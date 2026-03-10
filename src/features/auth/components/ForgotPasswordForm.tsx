import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import useForgotPasswordForm from '../hooks/useForgotPasswordForm';

const ForgotPasswordForm = () => {
  const {
    email,
    setEmail,
    submitted,
    handleSubmit,
    isSubmitting,
    error,
  } = useForgotPasswordForm();

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Forgot your password?</h1>
        <p className="text-gray-500">
          You will receive an email to reset your password. Please enter the
          email address associated with your account.
        </p>
      </div>

      {submitted && (
        <Alert>
          <AlertDescription>
            If an account exists for this email, you will receive a reset link
            shortly.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Email...
            </>
          ) : (
            'Send Email'
          )}
        </Button>
      </form>

      <div className="text-center text-sm">
        <Link to="/login" className="text-primary hover:underline font-medium">
          Back to sign in
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
