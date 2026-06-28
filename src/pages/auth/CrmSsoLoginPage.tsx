import axios from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import camelcaseKeys from 'camelcase-keys';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/AuthLayout';
import { Loader2 } from 'lucide-react';
import { useAppDispatch } from '@/app/hooks';
import { setUser } from '@/features/auth/redux/authSlice';
import type { User } from '@/features/auth/types/types';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;
const DEFAULT_REDIRECT = '/dashboard';

type CrmSsoExchangeResponse = {
  accessToken?: string;
  tokenType?: string;
  user?: User;
  redirectTo?: string;
};

const getSafeRedirectPath = (
  path: string | null | undefined
): string | null => {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return null;
  }

  try {
    const parsed = new URL(path, window.location.origin);

    if (parsed.origin !== window.location.origin) {
      return null;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
};

const removeTokenFromUrl = (redirect: string | null) => {
  const params = new URLSearchParams();

  if (redirect) {
    params.set('redirect', redirect);
  }

  const query = params.toString();
  const cleanUrl = query ? `/crm/sso-login?${query}` : '/crm/sso-login';
  window.history.replaceState(null, document.title, cleanUrl);
};

const CrmSsoLoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const exchangeStartedRef = useRef(false);
  const token = useMemo(() => searchParams.get('token'), [searchParams]);
  const redirect = useMemo(() => searchParams.get('redirect'), [searchParams]);
  const [error, setError] = useState<string | null>(null);
  const [isExchanging, setIsExchanging] = useState(true);
  const crmReturnUrl =
    typeof document !== 'undefined' && document.referrer
      ? document.referrer
      : null;

  useEffect(() => {
    if (exchangeStartedRef.current) {
      return;
    }

    exchangeStartedRef.current = true;
    removeTokenFromUrl(redirect);

    if (!token) {
      setError('Authentication token is missing.');
      setIsExchanging(false);
      return;
    }

    const exchangeToken = async () => {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/crm/sso/exchange`,
          { token, redirect },
          {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );
        console.log('response', response);
        const data = camelcaseKeys(response.data, {
          deep: true,
        }) as CrmSsoExchangeResponse;

        if (!data.accessToken) {
          setError('SSO authentication did not return an API token.');
          return;
        }

        localStorage.setItem('access_token', data.accessToken);

        if (data.user) {
          dispatch(setUser(data.user));
        }

        const nextPath =
          getSafeRedirectPath(data.redirectTo) ??
          getSafeRedirectPath(redirect) ??
          DEFAULT_REDIRECT;

        navigate(nextPath, { replace: true });
      } catch (caughtError) {
        if (
          axios.isAxiosError(caughtError) &&
          caughtError.response?.status === 401
        ) {
          setError('SSO link expired or already used');
          return;
        }

        setError('Unable to sign in with the SSO link. Please try again.');
      } finally {
        setIsExchanging(false);
      }
    };

    void exchangeToken();
  }, [dispatch, navigate, redirect, token]);

  return (
    <AuthLayout>
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Signing you in</h1>
          <p className="text-gray-500">
            Connecting your CRM session to Case Builder.
          </p>
        </div>

        {isExchanging && (
          <div className="flex items-center justify-center gap-3 rounded-lg border p-4 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Exchanging secure sign-in link...
          </div>
        )}

        {error && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <div className="flex flex-col gap-2 sm:flex-row">
              {crmReturnUrl && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    window.location.href = crmReturnUrl;
                  }}
                >
                  Back to CRM
                </Button>
              )}
              <Button asChild className="w-full">
                <Link to="/login">Go to login</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default CrmSsoLoginPage;
