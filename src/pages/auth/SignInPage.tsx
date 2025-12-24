import AuthLayout from '@/layouts/AuthLayout';
import LoginForm from '@/features/auth/components/LoginForm';

const SignInPage = () => {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
};

export default SignInPage;
