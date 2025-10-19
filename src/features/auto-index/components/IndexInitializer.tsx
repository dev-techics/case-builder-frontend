import { useGenerateIndex } from "../hooks/useGenerateIndex";

export function IndexInitializer() {
    // This hook automatically generates and updates the index
    useGenerateIndex();

    // This component doesn't render anything
    return null;
}