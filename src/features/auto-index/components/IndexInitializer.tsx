import { useGenerateIndex } from '../hooks/useGenerateIndex';

const IndexInitializer = () => {
  // This hook automatically generates and updates the index
  useGenerateIndex();

  // This component doesn't render anything
  return null;
};

export default IndexInitializer;
