// pages/RegisterPage.tsx
import AuthLayout from '@/layouts/AuthLayout';
import RegisterForm from '@/features/auth/components/RegisterForm';

const SignUpPage = () => {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
};

export default SignUpPage;
