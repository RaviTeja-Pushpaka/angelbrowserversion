/* eslint-disable no-unused-vars */
import { FileText, Save, X, MessageSquare, Phone, Users, Settings, User, Briefcase } from 'lucide-react';
import { RefObject, useEffect, useState } from 'react';

interface ModalProps {
  modalRef: RefObject<HTMLDialogElement>;
}

const UpdatePromptModal = ({ modalRef }: ModalProps) => {
  const [useCase, setUseCase] = useState<'interview' | 'sales' | 'meeting' | 'custom'>('interview');
  const [primaryData, setPrimaryData] = useState<string>('');
  const [secondaryData, setSecondaryData] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Get current use case from URL or localStorage
  useEffect(() => {
    const currentUseCase = localStorage.getItem('selectedUseCase') || 'interview';
    setUseCase(currentUseCase as any);
  }, []);

  const getModalConfig = () => {
    switch (useCase) {
      case 'interview':
        return {
          title: 'Update Interview Profile',
          subtitle: 'Modify your resume and job details for better assistance',
          icon: MessageSquare,
          primaryLabel: 'Resume/Profile',
          primaryPlaceholder: 'Update your resume content, skills, experience...',
          secondaryLabel: 'Target Job/Role',
          secondaryPlaceholder: 'Describe the job you\'re interviewing for...',
          color: 'from-purple-500 to-pink-500'
        };
      case 'sales':
        return {
          title: 'Update Sales Context',
          subtitle: 'Modify your sales script and context for better guidance',
          icon: Phone,
          primaryLabel: 'Sales Script/Context',
          primaryPlaceholder: 'Update your sales script, product details...',
          secondaryLabel: 'Additional Context',
          secondaryPlaceholder: 'Competitor info, pricing, objections...',
          color: 'from-blue-500 to-purple-500'
        };
      case 'meeting':
        return {
          title: 'Update Meeting Context',
          subtitle: 'Modify your meeting agenda and context for better support',
          icon: Users,
          primaryLabel: 'Meeting Agenda/Context',
          primaryPlaceholder: 'Update meeting agenda, participants, goals...',
          secondaryLabel: 'Additional Details',
          secondaryPlaceholder: 'Background context, key decisions needed...',
          color: 'from-green-500 to-blue-500'
        };
      case 'custom':
        return {
          title: 'Update Custom Instructions',
          subtitle: 'Modify your custom AI assistant behavior',
          icon: Settings,
          primaryLabel: 'Custom Instructions',
          primaryPlaceholder: 'Describe how you want your AI assistant to behave...',
          secondaryLabel: 'Additional Context',
          secondaryPlaceholder: 'Any additional context or preferences...',
          color: 'from-orange-500 to-red-500'
        };
      default:
        return {
          title: 'Update Profile',
          subtitle: 'Modify your profile details',
          icon: User,
          primaryLabel: 'Primary Information',
          primaryPlaceholder: 'Enter your primary information...',
          secondaryLabel: 'Additional Details',
          secondaryPlaceholder: 'Enter additional details...',
          color: 'from-gray-500 to-blue-500'
        };
    }
  };

  const handleSubmit = async () => {
    if (!primaryData.trim()) {
      setProcessingError('Primary information is required');
      return;
    }

    setIsProcessing(true);
    setProcessingError('');
    setSuccessMessage('');

    try {
      // Call the API to update the system prompt
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'update_profile',
          useCase: useCase,
          customData: primaryData.trim() + (secondaryData.trim() ? `\n\nAdditional Context:\n${secondaryData.trim()}` : '')
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // Save to localStorage for persistence
      localStorage.setItem('userProfileData', JSON.stringify({
        useCase,
        primaryData: primaryData.trim(),
        secondaryData: secondaryData.trim()
      }));

      setSuccessMessage('Profile updated successfully! Angel will now provide more personalized assistance.');
      
      // Clear form after success
      setTimeout(() => {
        setPrimaryData('');
        setSecondaryData('');
        setSuccessMessage('');
        if (modalRef.current) {
          modalRef.current.close();
        }
      }, 2000);

    } catch (error) {
      console.error('Profile update error:', error);
      setProcessingError('Failed to update profile. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const config = getModalConfig();

  return (
    <dialog
      ref={modalRef}
      className="modal backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          modalRef.current?.close();
        }
      }}
    >
      <div className="modal-box max-w-2xl bg-white shadow-2xl border border-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${config.color} flex items-center justify-center`}>
              <config.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-800">{config.title}</h3>
              <p className="text-sm text-neutral-600">{config.subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => modalRef.current?.close()}
            className="btn btn-sm btn-circle btn-ghost hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Use Case Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-3">Select Use Case</label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {(['interview', 'sales', 'meeting', 'custom'] as const).map((uc) => (
              <button
                key={uc}
                onClick={() => setUseCase(uc)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                  useCase === uc
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                {uc.charAt(0).toUpperCase() + uc.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Form */}
        <div className="space-y-6">
          {/* Primary Information */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {config.primaryLabel} <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder={config.primaryPlaceholder}
              className={`w-full h-32 p-4 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${
                processingError && !primaryData.trim() ? 'border-red-300' : 'border-neutral-300'
              }`}
              value={primaryData}
              onChange={(e) => setPrimaryData(e.target.value)}
              required
            />
            {processingError && !primaryData.trim() && (
              <p className="text-red-500 text-sm mt-1">{config.primaryLabel} is required</p>
            )}
          </div>

          {/* Secondary Information */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {config.secondaryLabel} <span className="text-neutral-400 text-xs">(Optional)</span>
            </label>
            <textarea
              placeholder={config.secondaryPlaceholder}
              className="w-full h-24 p-4 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              value={secondaryData}
              onChange={(e) => setSecondaryData(e.target.value)}
            />
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {processingError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {processingError}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-neutral-200">
          <button
            onClick={() => modalRef.current?.close()}
            className="btn btn-secondary"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isProcessing || !primaryData.trim()}
            className="btn btn-primary flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Update Profile
              </>
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default UpdatePromptModal;
