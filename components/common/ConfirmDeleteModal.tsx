import { RefObject } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ModalProps {
  handleClick: () => void;
  modalRef: RefObject<HTMLDialogElement>;
}

const ConfirmDeleteModal = ({ handleClick, modalRef }: ModalProps) => {
  const handleCancel = () => {
    modalRef.current?.close();
  };

  const handleConfirm = () => {
    handleClick();
    modalRef.current?.close();
  };

  return (
    <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle">
      <div className="fixed inset-0 bg-black/60 z-[10000]"></div>
      <div className="modal-box max-w-md w-full p-0 overflow-hidden card-professional animate-fade-in-scale relative z-[10001]">
        {/* Header */}
        <div className="bg-red-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl mr-3">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Delete Chat History
              </h3>
              <p className="text-red-100 text-sm">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="flex items-center justify-center w-8 h-8 text-white/90 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-white">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
            <h4 className="text-lg font-semibold text-neutral-900 mb-2">
              Are you sure you want to delete all chat history?
            </h4>
            <p className="text-neutral-700 text-sm leading-relaxed">
              This action will permanently remove all conversation history from your current session.
              This cannot be undone and all messages will be lost forever.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default ConfirmDeleteModal;
