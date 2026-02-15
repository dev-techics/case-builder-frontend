/**
 * This is the comment option component in the toolbar,
 * clicking on the comment button will set the pending comment state
 * and will create a input element at the right for adding a comment
 */

import { MessageSquareText } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useSidebarState } from '@/context/SidebarContext';
import {
  setCommentPosition,
  setPendingComment,
  setToolbarPosition,
} from '../redux';

function Comment() {
  const dispatch = useAppDispatch();
  const position = useAppSelector(state => state.toolbar.ToolbarPosition);
  const pendingHighlight = useAppSelector(
    state => state.toolbar.pendingHighlight
  );
  const { setIsOpen } = useSidebarState();

  const handleOnClick = () => {
    if (!pendingHighlight || position.y === null) {
      console.warn('⚠️ No pending highlight or position');
      return;
    }

    console.log('📝 Opening comment input');
    console.log('Toolbar position:', position);

    // Get the page element to calculate relative position
    const pageElement = document.querySelector(
      `[data-page-number="${pendingHighlight.pageNumber}"]`
    );

    if (!pageElement) {
      console.warn('⚠️ Page element not found');
      return;
    }

    const pageRect = pageElement.getBoundingClientRect();
    console.log('Page rect:', pageRect);

    // Calculate position relative to the page (not viewport)
    // const pageY = position.y - pageRect.top;
    const pageY = position.y;
    console.log('Calculated pageY:', pageY);

    // Store pending comment data
    dispatch(
      setPendingComment({
        fileId: pendingHighlight.fileId,
        pageNumber: pendingHighlight.pageNumber,
        selectedText: pendingHighlight.text,
        position: {
          x: 0,
          y: position.y || 0, // Viewport position
          pageY, // Position relative to page
        },
      })
    );

    // Open comment input at the current toolbar position
    dispatch(setCommentPosition({ x: 0, y: pageY }));

    // Hide the toolbar (but keep pendingHighlight for now)
    // The comment input will clear it when submitted or canceled
    dispatch(setToolbarPosition({ x: null, y: null }));

    //Close Right Sidebar for comment input field visibility
    setIsOpen(false);

    console.log('✅ Comment input opened, toolbar hidden');
  };

  return (
    <button
      className="flex h-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-all hover:bg-blue-50 hover:text-blue-600"
      onClick={handleOnClick}
      title="Add a comment"
      type="button"
    >
      <MessageSquareText size={16} />
      <span className="font-medium text-sm">Comment</span>
    </button>
  );
}

export default Comment;
