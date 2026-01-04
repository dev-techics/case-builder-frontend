import { HugeiconsIcon } from '@hugeicons/react';
import { LogoutSquare01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  const handleNavigation = () => {
    navigate('/dashboard/bundles');
  };
  return (
    <div>
      <header className="sticky top-0 z-0 flex h-14 items-center justify-between border-b bg-white px-4">
        <h1 className="font-semibold">Editor</h1>
        <div>
          <Button
            className="rounded-md p-2 bg-gray-200 cursor-pointer"
            type="button"
            variant={'ghost'}
            size={'icon'}
            onClick={handleNavigation}
          >
            <HugeiconsIcon size={20} icon={LogoutSquare01Icon} />
          </Button>{' '}
        </div>
      </header>
    </div>
  );
};

export default Header;
