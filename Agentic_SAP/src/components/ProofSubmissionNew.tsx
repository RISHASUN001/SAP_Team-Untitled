import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  X,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProofSubmissionProps {
  event: {
    id: string;
    title: string;
    proof_type?: string;
    description?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

const ProofSubmissionNew: React.FC<ProofSubmissionProps> = ({
  event,
  isOpen,
  onClose,
  onSubmitted
}) => {
  const { currentUser } = useAuth();
  const [proofType, setProofType] = useState<'text' | 'image' | 'file'>('text');
  const [textProof, setTextProof] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) return;

    let proofContent = '';
    let proofUrl = '';

    // Handle different proof types
    if (proofType === 'text') {
      if (!textProof.trim()) {
        alert('Please provide a description of your completion');
        return;
      }
      proofContent = textProof.trim();
    } else if (proofType === 'image' || proofType === 'file') {
      if (!selectedFile) {
        alert('Please select a file to upload');
        return;
      }
      
      // In a real implementation, you would upload the file to a server
      // For now, we'll convert to base64 and store locally
      const reader = new FileReader();
      reader.onload = async (e) => {
        proofUrl = e.target?.result as string;
        await submitProof(proofContent, proofUrl);
      };
      reader.readAsDataURL(selectedFile);
      return;
    }

    await submitProof(proofContent, proofUrl);
  };

  const submitProof = async (content: string, url: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5002/api/proof/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: event.id,
          user_id: currentUser?.id,
          proof_type: proofType,
          proof_content: content,
          proof_url: url
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          onSubmitted();
          handleClose();
        }, 2000);
      } else {
        console.error('Proof submission failed:', data.error);
        alert('Failed to submit proof. Please try again.');
      }
    } catch (error) {
      console.error('Proof submission error:', error);
      alert('Failed to submit proof. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTextProof('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setSubmitSuccess(false);
    setProofType('text');
    onClose();
  };

  if (!isOpen) return null;

  if (submitSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Proof Submitted!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your completion proof has been submitted for review.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Submit Proof of Completion
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Event Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
              {event.title}
            </h3>
            {event.description && (
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {event.description}
              </p>
            )}
          </div>

          {/* Proof Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              How would you like to submit your proof?
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setProofType('text')}
                className={`p-3 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                  proofType === 'text'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <FileText className={`h-6 w-6 ${
                  proofType === 'text' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'
                }`} />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Text Description
                </span>
              </button>

              <button
                onClick={() => setProofType('image')}
                className={`p-3 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                  proofType === 'image'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <ImageIcon className={`h-6 w-6 ${
                  proofType === 'image' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'
                }`} />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Screenshot/Photo
                </span>
              </button>

              <button
                onClick={() => setProofType('file')}
                className={`p-3 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                  proofType === 'file'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <Upload className={`h-6 w-6 ${
                  proofType === 'file' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'
                }`} />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Upload File
                </span>
              </button>
            </div>
          </div>

          {/* Text Input */}
          {proofType === 'text' && (
            <div className="mb-6">
              <label htmlFor="textProof" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describe what you completed:
              </label>
              <textarea
                id="textProof"
                value={textProof}
                onChange={(e) => setTextProof(e.target.value)}
                placeholder="Describe what you accomplished, what you learned, or any challenges you overcame..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                rows={5}
              />
            </div>
          )}

          {/* File Upload */}
          {(proofType === 'image' || proofType === 'file') && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {proofType === 'image' ? 'Upload Screenshot or Photo:' : 'Upload File:'}
              </label>
              
              {!selectedFile ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
                >
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {proofType === 'image' ? 'PNG, JPG up to 10MB' : 'Any file up to 10MB'}
                  </p>
                </div>
              ) : (
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      {previewUrl ? (
                        <ImageIcon className="h-5 w-5 text-green-600 mr-2" />
                      ) : (
                        <Upload className="h-5 w-5 text-blue-600 mr-2" />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedFile.name}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full h-32 object-contain rounded"
                    />
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={proofType === 'image' ? 'image/*' : '*'}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
              />
            </div>
          )}

          {/* Guidelines */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                  Submission Guidelines
                </h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                  <li>• Be specific about what you completed</li>
                  <li>• Include any key insights or challenges faced</li>
                  <li>• Screenshots of completed work are highly valued</li>
                  <li>• Your manager will review submissions for progress tracking</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || 
                (proofType === 'text' && !textProof.trim()) ||
                ((proofType === 'image' || proofType === 'file') && !selectedFile)
              }
              className="flex-1 flex items-center justify-center px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Submit Proof
                </>
              )}
            </button>
            
            <button
              onClick={handleClose}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProofSubmissionNew;