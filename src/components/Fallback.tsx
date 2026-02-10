import type { FallbackProps } from 'react-error-boundary';
import { Button } from './ui/button';

const Fallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <div>
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
      <Button onClick={resetErrorBoundary}>Try again</Button>
    </div>
  );
};

export default Fallback;
