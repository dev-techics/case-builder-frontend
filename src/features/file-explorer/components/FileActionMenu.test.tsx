import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import FileActionMenu from './FileActionMenu';
import fileTreeReducer, { removeFile } from '../fileTreeSlice';
import type { FileNode } from '../types';
import type { Mock } from 'vitest';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

// Mock file data
const mockFile: FileNode = {
  id: 'file-1',
  name: 'test-file.txt',
  type: 'file',
  url: 'file-url',
};

// Helper function to create a mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      fileTree: fileTreeReducer,
    },
    preloadedState: {
      fileTree: {
        tree: {
          id: 'proj-1',
          name: 'Project',
          type: 'folder',
          children: [mockFile], // ✅ Files go in tree.children
        },
        expandedFolders: ['proj-1'],
        selectedFile: null,
        scrollToFileId: null,
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
        <FileActionMenu file={mockFile} onRenameClick={onRenameClick} />
      );

      const button = screen.getByRole('button', { name: /open edit menu/i });
      expect(button).toBeInTheDocument();
    });

    it('should open dropdown menu when ellipsis button is clicked', async () => {
      const user = userEvent.setup(); // ✅ Setup user-event

      renderWithProvider(
        <FileActionMenu file={mockFile} onRenameClick={onRenameClick} />
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
