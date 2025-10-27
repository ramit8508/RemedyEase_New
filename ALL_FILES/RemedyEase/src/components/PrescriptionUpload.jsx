import React, { useState } from 'react';
import '../Css_for_all/PrescriptionUpload.css';

export default function PrescriptionUpload({ appointmentId, doctorEmail, onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (PDF, images)
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setMessage('Please upload a PDF or image file (JPG, PNG)');
        setMessageType('error');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('File size should not exceed 5MB');
        setMessageType('error');
        return;
      }
      
      setSelectedFile(file);
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select a file first');
      setMessageType('error');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('prescription', selectedFile);
      formData.append('doctorEmail', doctorEmail);

      const response = await fetch(`/api/v1/appointments/prescription/${appointmentId}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Prescription uploaded successfully!');
        setMessageType('success');
        setSelectedFile(null);
        // Reset file input
        document.getElementById('prescription-file-input').value = '';
        
        // Notify parent component
        if (onUploadSuccess) {
          onUploadSuccess(data.data);
        }
      } else {
        setMessage(data.message || 'Failed to upload prescription');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('Failed to upload prescription. Please try again.');
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="prescription-upload-container">
      <h4>📋 Upload Prescription</h4>
      
      <div className="upload-area">
        <input
          id="prescription-file-input"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          className="file-input"
        />
        
        {selectedFile && (
          <div className="selected-file">
            <span>📄 {selectedFile.name}</span>
            <button 
              onClick={() => {
                setSelectedFile(null);
                document.getElementById('prescription-file-input').value = '';
              }}
              className="remove-file-btn"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="upload-btn"
      >
        {uploading ? 'Uploading...' : 'Upload Prescription'}
      </button>

      {message && (
        <div className={`upload-message ${messageType}`}>
          {message}
        </div>
      )}
    </div>
  );
}
