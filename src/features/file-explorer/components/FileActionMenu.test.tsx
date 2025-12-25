import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import FileActionMenu from './FileActionMenu';
import fileTreeReducer, { type Tree } from '../fileTreeSlice';
import type { Mock } from 'vitest';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

// Mock file data
const mockData: Tree = {
  id: 'proj-1',
  projectName: 'Project Alpha',
  type: 'folder',
  children: [
    {
      id: 'file-1',
      name: 'Sample.pdf',
      type: 'file',
      url: '/sample.pdf',
    },
    {
      id: 'file-9',
      name: 'Design.pdf',
      type: 'file',
      url: '/file-sample_150kB.pdf',
    },
    {
      id: 'file-2',
      name: 'Specs.pdf',
      type: 'file',
      url: '/dummy-pdf_2.pdf',
    },
    {
      id: 'file-5',
      name: 'Report.pdf',
      type: 'file',
      url: '/pdf_3.pdf',
    },
    {
      id: 'file-901',
      name: 'importants',
      type: 'folder',
      children: [
        {
          id: 'file-98',
          name: 'test.pdf',
          type: 'file',
          url: '/test.pdf',
        },
      ],
    },
    {
      id: 'file-6',
      name: 'test.pdf',
      type: 'file',
      url: '/test.pdf',
    },
    {
      id: 'file-8',
      name: 'test-2.pdf',
      type: 'file',
      url: '/test-2.pdf',
    },
  ],
};

// Helper function to create a mock store
// Helper function to create a mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      fileTree: fileTreeReducer,
    },
    preloadedState: {
      fileTree: {
        tree: mockData,
        expandedFolders: ['proj-1'],
        selectedFile: null,
        scrollToFileId: null,
        loading: false,
        error: null,
      },
    },
  });
};
// Helper function to render component with Redux store
const renderWithProvider = (component: React.ReactElement) => {
  const store = createMockStore();
  return {
    ...render(<Provider store={store}>{component}</Provider>),
    store,
  };
};

describe('FileActionMenu', () => {
  let onRenameClick: Mock<() => void>;

  beforeEach(() => {
    onRenameClick = vi.fn();
  });

  describe('Dropdown Menu', () => {
    it('should render the ellipsis button', () => {
      renderWithProvider(
        <FileActionMenu
          file={mockData.children[0]}
          onRenameClick={onRenameClick}
        />
      );

      const button = screen.getByRole('button', { name: /open edit menu/i });
      expect(button).toBeInTheDocument();
    });

    it('should open dropdown menu when ellipsis button is clicked', async () => {
      const user = userEvent.setup(); // ✅ Setup user-event

      renderWithProvider(
        <FileActionMenu
          file={mockData.children[0]}
          onRenameClick={onRenameClick}
        />
      );

      const button = screen.getByRole('button', { name: /open edit menu/i });
      await user.click(button); // ✅ Use user.click instead of fireEvent.click

      await waitFor(() => {
        expect(screen.getByText('Rename')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });
  });

  /*
  describe('Rename Functionality', () => {
    it('should call onRenameClick when Rename is clicked', async () => {
      renderWithProvider(
        <FileActionMenu file={mockFile} onRenameClick={onRenameClick} />
      );

      const button = screen.getByRole('button', { name: /open edit menu/i });
      fireEvent.click(button);

      await waitFor(() => {
        const renameItem = screen.getByText('Rename');
        fireEvent.click(renameItem);
      });

      expect(onRenameClick).toHaveBeenCalledTimes(1);
    });

    it('should stop propagation when Rename is clicked', async () => {
      const parentClick = vi.fn();
      renderWithProvider(
        <div onClick={parentClick}>
          <FileActionMenu file={mockFile} onRenameClick={onRenameClick} />
        </div>
      );

      const button = screen.getByRole('button', { name: /open edit menu/i });
      fireEvent.click(button);

      await waitFor(() => {
        const renameItem = screen.getByText('Rename');
        fireEvent.click(renameItem);
      });

      expect(onRenameClick).toHaveBeenCalled();
    });
  });

  describe('Delete Functionality', () => {
    it('should show confirmation dialog when Delete is clicked', async () => {
      renderWithProvider(
        <FileActionMenu file={mockFile} onRenameClick={onRenameClick} />
      );

      const button = screen.getByRole('button', { name: /open edit menu/i });
      fireEvent.click(button);

      await waitFor(() => {
        const deleteItem = screen.getByText('Delete');
        fireEvent.click(deleteItem);
      });

      await waitFor(() => {
        expect(screen.getByText('Delete File')).toBeInTheDocument();
        expect(
          screen.getByText(
            `Are you sure you want to delete "${mockFile.name}"? This action cannot be undone.`
          )
        ).toBeInTheDocument();
      });
    });

    it('should show Cancel and Delete buttons in dialog', async () => {
      renderWithProvider(
        <FileActionMenu file={mockFile} onRenameClick={onRenameClick} />
      );

      const button = screen.getByRole('button', { name: /open edit menu/i });
      fireEvent.click(button);

      await waitFor(() => {
        const deleteItem = screen.getByText('Delete');
        fireEvent.click(deleteItem);
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Cancel' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: 'Delete' })
        ).toBeInTheDocument();
      });
    });

    it('should close dialog when Cancel is clicked', async () => {
      renderWithProvider(
        <FileActionMenu file={mockFile} onRenameClick={onRenameClick} />
      );

      const button = screen.getByRole('button', { name: /open edit menu/i });
      fireEvent.click(button);

      await waitFor(() => {
        const deleteItem = screen.getByText('Delete');
        fireEvent.click(deleteItem);
      });

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: 'Cancel' });
        fireEvent.click(cancelButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Delete File')).not.toBeInTheDocument();
      });
    });

    it('should dispatch removeFile action when Delete is confirmed', async () => {
      const { store } = renderWithProvider(
        <FileActionMenu file={mockFile} onRenameClick={onRenameClick} />
      );

      const dispatchSpy = vi.spyOn(store, 'dispatch');

      const button = screen.getByRole('button', { name: /open edit menu/i });
      fireEvent.click(button);

      await waitFor(() => {
        const deleteItem = screen.getByText('Delete');
        fireEvent.click(deleteItem);
      });

      await waitFor(() => {
        const deleteButton = screen.getAllByRole('button', {
          name: 'Delete',
        })[1];
        fireEvent.click(deleteButton);
      });

      expect(dispatchSpy).toHaveBeenCalledWith(removeFile(mockFile.id));
    });

    it('should close dialog after confirming delete', async () => {
      renderWithProvider(
        <FileActionMenu file={mockFile} onRenameClick={onRenameClick} />
      );

      const button = screen.getByRole('button', { name: /open edit menu/i });
      fireEvent.click(button);

      await waitFor(() => {
        const deleteItem = screen.getByText('Delete');
        fireEvent.click(deleteItem);
      });

      await waitFor(() => {
        const deleteButton = screen.getAllByRole('button', {
          name: 'Delete',
        })[1];
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Delete File')).not.toBeInTheDocument();
      });
    });

    it('should stop propagation when Delete menu item is clicked', async () => {
      const parentClick = vi.fn();
      renderWithProvider(
        <div onClick={parentClick}>
          <FileActionMenu file={mockFile} onRenameClick={onRenameClick} />
        </div>
      );

      const button = screen.getByRole('button', { name: /open edit menu/i });
      fireEvent.click(button);

      await waitFor(() => {
        const deleteItem = screen.getByText('Delete');
        fireEvent.click(deleteItem);
      });

      await waitFor(() => {
        expect(screen.getByText('Delete File')).toBeInTheDocument();
      });
    });
  });
*/
});
