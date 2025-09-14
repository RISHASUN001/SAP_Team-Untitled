import { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  FileText, 
  Link, 
  Camera,
  MessageSquare,
  User,
  Calendar
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

const ProofReview = () => {
  const { currentUser } = useAuth();
  const { completionProofs, reviewProof, timelineEvents } = useData();
  
  const [selectedProof, setSelectedProof] = useState<any>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Filter proofs based on current filter
  const filteredProofs = completionProofs.filter(proof => {
    if (filter === 'all') return true;
    return proof.status === filter;
  });

  const handleReview = (proofId: string, status: 'approved' | 'rejected') => {
    reviewProof(proofId, status, reviewComments, currentUser?.id);
    setSelectedProof(null);
    setReviewComments('');
  };

  const getProofTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return Camera;
      case 'document': return FileText;
      case 'link': return Link;
      case 'text': return MessageSquare;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderProofContent = (proof: any) => {
    switch (proof.proofType) {
      case 'image':
        return (
          <div className="mt-4">
            <img 
              src={proof.content} 
              alt="Proof submission" 
              className="max-w-full h-64 object-contain rounded-lg border"
            />
          </div>
        );
      
      case 'document':
        return (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-300">Document Submitted</p>
                <p className="text-sm text-blue-700 dark:text-blue-400">Click to download and review</p>
              </div>
            </div>
          </div>
        );
      
      case 'link':
        return (
          <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-3" />
                <div>
                  <p className="font-medium text-purple-900 dark:text-purple-300">Link Submitted</p>
                  <a 
                    href={proof.content} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-purple-700 dark:text-purple-400 hover:underline break-all"
                  >
                    {proof.content}
                  </a>
                </div>
              </div>
              <a 
                href={proof.content} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-800/50 rounded-lg transition-colors"
              >
                <Eye className="h-4 w-4" />
              </a>
            </div>
          </div>
        );
      
      case 'text':
        return (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{proof.content}</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Proof Review Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Review and approve completion proofs submitted by your team members
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {['all', 'pending', 'approved', 'rejected'].map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === filterType
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            <span className="ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-xs rounded-full">
              {completionProofs.filter(p => filterType === 'all' || p.status === filterType).length}
            </span>
          </button>
        ))}
      </div>

      {/* Proofs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProofs.map((proof) => {
          const timelineEvent = timelineEvents.find(e => e.id === proof.timelineEventId);
          const ProofIcon = getProofTypeIcon(proof.proofType);
          
          return (
            <div 
              key={proof.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedProof(proof)}
            >
              {/* Card Header */}
              <div className="p-4 border-b dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {timelineEvent?.title || 'Unknown Activity'}
                    </h3>
                    <div className="flex items-center mt-1 space-x-2">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {proof.userId}
                      </span>
                    </div>
                  </div>
                  
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(proof.status)}`}>
                    {proof.status.charAt(0).toUpperCase() + proof.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mr-3">
                    <ProofIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {proof.proofType} Proof
                    </p>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(proof.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Proof Preview */}
                {proof.proofType === 'image' && (
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-3">
                    <img 
                      src={proof.content} 
                      alt="Proof preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {proof.proofType === 'text' && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                    {proof.content}
                  </p>
                )}
                
                {proof.proofType === 'link' && (
                  <div className="flex items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-3">
                    <Link className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {proof.content}
                    </span>
                  </div>
                )}

                {/* Quick Actions */}
                {proof.status === 'pending' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReview(proof.id, 'approved');
                      }}
                      className="flex-1 flex items-center justify-center px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProof(proof);
                      }}
                      className="flex-1 flex items-center justify-center px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                  </div>
                )}

                {proof.status !== 'pending' && proof.reviewedAt && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Reviewed on {new Date(proof.reviewedAt).toLocaleDateString()}
                    {proof.reviewedBy && ` by ${proof.reviewedBy}`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredProofs.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No proofs to review
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'pending' 
              ? "All caught up! No pending proofs to review." 
              : `No ${filter} proofs found.`}
          </p>
        </div>
      )}

      {/* Detailed Review Modal */}
      {selectedProof && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Review Proof Submission
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {timelineEvents.find(e => e.id === selectedProof.timelineEventId)?.title}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProof(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>

              {/* Proof Content */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                  Submitted Proof:
                </h3>
                {renderProofContent(selectedProof)}
              </div>

              {/* Submission Details */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Submission Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Submitted by:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{selectedProof.userId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Date:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {new Date(selectedProof.submittedAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="ml-2 text-gray-900 dark:text-white capitalize">
                      {selectedProof.proofType}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getStatusColor(selectedProof.status)}`}>
                      {selectedProof.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Review Comments */}
              {selectedProof.status === 'pending' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Review Comments (Optional)
                  </label>
                  <textarea
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    placeholder="Add feedback or comments about this submission..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white resize-none"
                    rows={4}
                  />
                </div>
              )}

              {/* Previous Review Comments */}
              {selectedProof.reviewComments && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Review Comments:</h4>
                  <p className="text-blue-800 dark:text-blue-200 text-sm">{selectedProof.reviewComments}</p>
                  {selectedProof.reviewedBy && selectedProof.reviewedAt && (
                    <p className="text-blue-600 dark:text-blue-400 text-xs mt-2">
                      By {selectedProof.reviewedBy} on {new Date(selectedProof.reviewedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3">
                {selectedProof.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleReview(selectedProof.id, 'approved')}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(selectedProof.id, 'rejected')}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setSelectedProof(null)}
                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProofReview;