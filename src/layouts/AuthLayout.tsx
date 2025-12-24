// features/auth/components/AuthLayout.tsx
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        {children}
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-indigo-700 items-center justify-center p-8">
        <div className="max-w-md text-white space-y-6">
          <h2 className="text-4xl font-bold">Case Builder</h2>
          <p className="text-lg text-blue-100">
            Streamline your legal case management with our powerful document
            builder and organization tools.
          </p>
          <div className="space-y-4 pt-8">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                ✓
              </div>
              <div>
                <h3 className="font-semibold">Smart Document Management</h3>
                <p className="text-blue-100 text-sm">
                  Organize and manage all your case documents in one place
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                ✓
              </div>
              <div>
                <h3 className="font-semibold">Auto-Index Generation</h3>
                <p className="text-blue-100 text-sm">
                  Automatically generate comprehensive case indexes
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                ✓
              </div>
              <div>
                <h3 className="font-semibold">Collaborative Annotations</h3>
                <p className="text-blue-100 text-sm">
                  Add comments and highlights to your documents
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
