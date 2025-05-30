import React, { useState, useEffect } from 'react';
import { FileText, Trash2, Download, Search, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadAPI } from '../../services/api';

const DocumentList = ({ onDocumentSelect, selectedDocumentId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await uploadAPI.getDocuments();
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await uploadAPI.deleteDocument(documentId);
      setDocuments(documents.filter(doc => doc.id !== documentId));
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Failed to delete document');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Ready';
      case 'processing':
        return 'Processing...';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-center text-red-600">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>{error}</p>
          <button
            onClick={fetchDocuments}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>No documents uploaded yet</p>
        <p className="text-sm">Upload a PDF to get started</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-medium text-gray-900 mb-3">
        Your Documents ({documents.length})
      </h3>
      
      {documents.map((document) => (
        <div
          key={document.id}
          className={`border rounded-lg p-3 transition-colors cursor-pointer ${
            selectedDocumentId === document.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
          onClick={() => onDocumentSelect && onDocumentSelect(document)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <FileText className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {document.filename}
                </p>
                
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusIcon(document.status)}
                  <span className="text-xs text-gray-500">
                    {getStatusText(document.status)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                  <span>{formatFileSize(document.size)}</span>
                  <span>{formatDate(document.uploadedAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 ml-2">
              {document.status === 'completed' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Implement search within document
                    console.log('Search in document:', document.id);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Search in document"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(document.id);
                }}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentList;
