import type { FallbackProps } from 'react-error-boundary';
import { Button } from './ui/button';

const Fallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <div>
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>
        <Button variant="default">Try again</Button>
      </button>
    </div>
  );
};

export default Fallback;
