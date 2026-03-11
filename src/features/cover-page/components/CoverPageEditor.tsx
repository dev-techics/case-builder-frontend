import { Button } from '@/components/ui/button';
import LexicalCoverPageEditor from './LexicalCoverPageEditor';

export const CoverPageEditor = () => {
  return (
    <>
      {/* -------------------
            Editor Header 
        -------------------*/}
      <div className="flex items-center justify-between">
        <div> Edit Cover Page</div>
        <div className="flex gap-2">
          <Button variant="outline">Cancel</Button>
          <Button>Save</Button>
        </div>
      </div>
      {/*-------------------
                Editor 
        --------------------*/}
      <div className="flex-1 min-h-0 overflow-hidden px-4 py-2">
        <LexicalCoverPageEditor />
      </div>
    </>
  );
};
