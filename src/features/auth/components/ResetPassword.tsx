import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { authApi } from '../api/authApi';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ResetPassword = () => {
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || !confirmNewPassword) {
      setError('All fields are required.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (email == null || token == null) {
      setError('Invalid token');
      return;
    }
    try {
      setLoading(true);

      const response = await authApi.resetPassword(
        email,
        token,
        newPassword,
        confirmNewPassword
      );

      setSuccess(response.message); // success message
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Reset link is invalid or expired'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center">
      <div className="w-full max-w-md mx-auto text-center border p-4 rounded-md shadow-sm">
        <h1 className="mb-4 font-semibold text-xl">Reset Password</h1>
        {/* ---------- Error message ----------- */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {/* ---------- Success message ----------- */}
        {success && (
          <Alert variant="default" className="mb-4">
            <CheckCircle size={20} className="text-green-700" />
            <AlertDescription className="text-green-600">
              {success}
            </AlertDescription>
          </Alert>
        )}
        {/* -------- Reset form ---------- */}
        <form className="flex flex-col gap-6" onSubmit={handleResetPassword}>
          <Label>New Password</Label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="focus:outline-0"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <Label>Confirm password</Label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmNewPassword}
              onChange={e => setConfirmNewPassword(e.target.value)}
              placeholder="confirm new password"
              className="focus:outline-0"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <Button disabled={loading} type="submit">
            Submit
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
