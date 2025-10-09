export function useHighlightManager() {
    const [highlights, setHighlights] = useState<Highlight[]>([]);

    const addHighlight = (pageNumber: number, coords: any, text: string) => {
        const highlight: Highlight = {
            pageNumber,
            coordinates: {
                x: coords.x,
                y: coords.y,
                width: coords.width,
                height: coords.height,
            },
            text,
            id: `highlight-${Date.now()}-${Math.random()}`,
        };

        console.log("✅ Creating highlight:", highlight);
        setHighlights(prev => [...prev, highlight]);
        return highlight;
    };

    const removeHighlight = (id: string) => {
        setHighlights(prev => prev.filter(h => h.id !== id));
    };

    const clearHighlights = () => {
        setHighlights([]);
    };

    return {
        highlights,
        addHighlight,
        removeHighlight,
        clearHighlights,
    };
}