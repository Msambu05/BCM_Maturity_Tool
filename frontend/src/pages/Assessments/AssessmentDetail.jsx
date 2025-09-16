import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  PaperClipIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  PencilIcon,
  ClockIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ChartBarIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function AssessmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assessment, setAssessment] = useState(null);
  const [components, setComponents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [activeComponent, setActiveComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showGuidance, setShowGuidance] = useState({});

  // Auto-save functionality
  const autoSaveTimeoutRef = useRef(null);
  const AUTOSAVE_DELAY = 2000; // 2 seconds

  // Fetch all assessment data
  const fetchAssessmentData = useCallback(async () => {
    try {
      setLoading(true);
      const assessmentResponse = await client.get(`/api/assessments/assessments/${id}/`);
      setAssessment(assessmentResponse.data);

      const componentsResponse = await client.get('/api/assessments/components/');
      setComponents(componentsResponse.data);
      if (componentsResponse.data.length > 0) {
        setActiveComponent(componentsResponse.data[0].id);
      }

      const questionsResponse = await client.get('/api/assessments/questions/');
      setQuestions(questionsResponse.data);

      try {
        const responsesResponse = await client.get(`/api/assessments/responses/?assessment=${id}`);
        const existingResponses = {};
        responsesResponse.data.forEach(response => {
          existingResponses[response.question_id] = {
            score: response.maturity_score,
            comments: response.comments || '',
            evidence: response.evidence || []
          };
        });
        setResponses(existingResponses);
      } catch {
        console.log('No existing responses found');
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching assessment data:', err);
      setError('Failed to load assessment data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAssessmentData();
  }, [fetchAssessmentData]);

// Enhanced validation function
const validateResponseData = (responseData) => {
  const errors = [];
  
  if (!responseData.assessment || isNaN(responseData.assessment)) {
    errors.push('Invalid assessment ID');
  }
  
  if (!responseData.question || isNaN(responseData.question)) {
    errors.push('Invalid question ID');
  }
  
  if (responseData.maturity_score === null || responseData.maturity_score === undefined || isNaN(responseData.maturity_score)) {
    errors.push('Invalid maturity score');
  }
  
  if (responseData.maturity_score < 0 || responseData.maturity_score > 5) {
    errors.push('Maturity score must be between 0 and 5');
  }
  
  return errors;
};

  // Enhanced autoSave with better validation
  const autoSave = useCallback(async (updatedResponses) => {
    if (user?.role !== 'business_unit_champion') return;

    try {
      setAutoSaving(true);

      // Save to localStorage
      localStorage.setItem(`assessment_${id}_responses`, JSON.stringify(updatedResponses));

      // Save to backend (only questions with valid scores)
      const responsesData = [];

      Object.entries(updatedResponses).forEach(([questionId, response]) => {
        if (response.score !== undefined &&
            response.score !== null &&
            !isNaN(response.score) &&
            response.score >= 0 &&
            response.score <= 5) {

          const responseData = {
            assessment: parseInt(id),
            question: parseInt(questionId),
            maturity_score: parseInt(response.score),
            comments: (response.comments || '').trim()
          };

          // Only add if validation passes
          const validationErrors = validateResponseData(responseData);
          if (validationErrors.length === 0) {
            responsesData.push(responseData);
          }
        }
      });

      if (responsesData.length > 0) {
        console.log('Auto-saving responses:', responsesData);
        await client.post('/api/assessments/responses/bulk/', {
          responses: responsesData
        });
      }

      setLastSaved(new Date());
      setError(null);
    } catch (err) {
      console.error('Auto-save error:', err);
      if (err.response) {
        console.error('Auto-save backend error:', err.response.data);
      }
      // Don't show error for auto-save failures to avoid interrupting user
    } finally {
      setAutoSaving(false);
    }
  }, [id, user?.role]);

  // Handle response changes with auto-save
  const handleResponseChange = (questionId, field, value) => {
    setResponses(prev => {
      const updated = {
        ...prev,
        [questionId]: {
          ...prev[questionId],
          [field]: value
        }
      };
      
      // Clear existing auto-save timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      // Set new auto-save timeout
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSave(updated);
      }, AUTOSAVE_DELAY);
      
      return updated;
    });
  };

  // Manual save function
  const handleManualSave = async () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    try {
      setSaving(true);
      await autoSave(responses);
    } catch (err) {
      setError('Failed to save responses. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Load saved responses from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`assessment_${id}_responses`);
    if (saved) {
      try {
        setResponses(JSON.parse(saved));
      } catch (err) {
        console.error('Error parsing saved responses:', err);
      }
    }
  }, [id]);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Enhanced file upload with better error handling
  const handleFileUpload = async (questionId, file) => {
    try {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setError('File size must be less than 10MB');
        return;
      }

      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'text/plain'
      ];

      if (!allowedTypes.includes(file.type)) {
        setError('File type not supported. Please upload PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, or TXT files.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('assessment_id', id);
      formData.append('question_id', questionId);
      formData.append('title', file.name);
      formData.append('evidence_type', 'other');

      console.log('Uploading file:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        assessmentId: id,
        questionId: questionId
      });

      setUploading(true);
      setProgress(0);

      const response = await client.post('/api/evidence/evidence/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(progress);
        }
      });

      console.log('File upload success:', response.data);

      setResponses(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          evidence: [...(prev[questionId]?.evidence || []), response.data]
        }
      }));

      setError(null);
      setProgress(0);
    } catch (err) {
      console.error('Error uploading file:', err);

      if (err.response) {
        console.error('Upload error response:', err.response.data);
        console.error('Upload error status:', err.response.status);

        if (err.response?.data?.file_path) {
          setError(`Upload failed: ${err.response.data.file_path[0]}`);
        } else if (err.response?.data?.error) {
          setError(`Upload failed: ${err.response.data.error}`);
        } else if (err.response?.data?.detail) {
          setError(`Upload failed: ${err.response.data.detail}`);
        } else if (err.response?.status === 413) {
          setError('File too large. Please choose a smaller file.');
        } else if (err.response?.status >= 500) {
          setError('Server error during file upload. Please try again.');
        } else {
          setError('Failed to upload evidence. Please try again.');
        }
      } else if (err.request) {
        setError('Network error during file upload. Please check your connection.');
      } else {
        setError('Failed to upload evidence. Please try again.');
      }
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // Enhanced drag-and-drop upload component
  const FileUploadInput = ({ questionId }) => {
    const fileInputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    const handleFileSelect = (file) => {
      if (file && file.size > 0) {
        handleFileUpload(questionId, file);
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    };

    return (
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <PaperClipIcon className="h-4 w-4 mr-2" />
          Supporting Evidence *
        </label>
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            dragOver
              ? 'border-indigo-400 bg-indigo-50 shadow-lg'
              : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => {
              if (e.target.files[0]) handleFileSelect(e.target.files[0]);
            }}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
            disabled={uploading}
          />
          <div className="space-y-4">
            {uploading ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <CloudArrowUpIcon className="h-12 w-12 text-indigo-500 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-indigo-600">Uploading...</div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">{progress}% complete</div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  <CloudArrowUpIcon className="h-12 w-12 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Click to upload
                  </button>
                  <span className="text-gray-500"> or drag and drop</span>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, TXT up to 10MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Enhanced handleSubmit with better validation
  const handleSubmit = async () => {
    try {
      setError(null);

      // Get all questions that have responses
      const questionsWithResponses = questions.filter(q =>
        responses[q.id] &&
        responses[q.id].score !== undefined &&
        responses[q.id].score !== null &&
        !isNaN(responses[q.id].score)
      );

      // Check if all questions are answered
      const unanswered = questions.filter(q =>
        !responses[q.id] ||
        responses[q.id].score === undefined ||
        responses[q.id].score === null ||
        isNaN(responses[q.id].score)
      );

      if (unanswered.length > 0) {
        console.log('Unanswered questions:', unanswered.map(q => ({ id: q.id, text: q.text })));
        setError(`Please answer all questions before submitting. ${unanswered.length} questions remain unanswered.`);
        return;
      }

      // Check evidence requirement for business_unit_champion
      if (user?.role === 'business_unit_champion') {
        for (const question of questions) {
          const response = responses[question.id];
          if (!response || !response.evidence || response.evidence.length === 0) {
            setError(`Please upload supporting evidence for question: "${question.text}"`);
            return;
          }
        }
      }

      setSaving(true);

      // Format responses data with correct field names and validation
      const responsesData = [];

      for (const question of questionsWithResponses) {
        const response = responses[question.id];

        const responseData = {
          assessment: parseInt(id),
          question: parseInt(question.id),
          maturity_score: parseInt(response.score),
          comments: (response.comments || '').trim()
        };

        // Validate each response
        const validationErrors = validateResponseData(responseData);
        if (validationErrors.length > 0) {
          console.error(`Validation errors for question ${question.id}:`, validationErrors);
          setError(`Invalid data for question "${question.text}": ${validationErrors.join(', ')}`);
          return;
        }

        responsesData.push(responseData);
      }

      console.log('Submitting responses data:', responsesData);
      console.log('Sample response:', responsesData[0]);

      // Double-check we have data to submit
      if (responsesData.length === 0) {
        setError('No valid responses to submit. Please answer at least one question.');
        return;
      }

      const response = await client.post('/api/assessments/responses/bulk/', {
        responses: responsesData
      });

      console.log('Bulk response success:', response.data);

      // Submit the assessment to mark it as submitted
      try {
        const submitResponse = await client.post(`/api/assessments/assessments/${id}/submit/`);
        console.log('Assessment submit success:', submitResponse.data);
      } catch (submitErr) {
        console.error('Error submitting assessment:', submitErr);
        // Don't fail the whole process if submit fails, but log it
      }

      // Only clear localStorage on successful submission
      localStorage.removeItem(`assessment_${id}_responses`);
      navigate('/assessments');

    } catch (err) {
      console.error('Error saving responses:', err);

      // More detailed error logging
      if (err.response) {
        console.error('Backend error response:', JSON.stringify(err.response.data, null, 2));
        console.error('Backend error status:', err.response.status);
        console.error('Backend error headers:', err.response.headers);

        // Show specific error from backend
        if (err.response.data?.error) {
          setError(`Failed to save: ${err.response.data.error}`);
        } else if (err.response.data?.detail) {
          setError(`Failed to save: ${err.response.data.detail}`);
        } else if (err.response.status >= 500) {
          setError('Server error occurred. Please try again in a few minutes.');
        } else {
          setError('Failed to save responses. Please check all required fields are completed.');
        }
      } else if (err.request) {
        console.error('No response received:', err.request);
        setError('Network error. Please check your connection and try again.');
      } else {
        console.error('Request setup error:', err.message);
        setError('Failed to save responses. Please try again.');
      }

    } finally {
      setSaving(false);
    }
  };

  const getMaturityDescription = (score) => {
    const descriptions = {
      0: 'Not Started (0%)',
      1: 'Initial (1-39%)',
      2: 'Developing/Repeatable (40-59%)',
      3: 'Defined (60-79%)',
      4: 'Managed (80-99%)',
      5: 'Optimized (100%)'
    };
    return descriptions[score] || '';
  };

  const getMaturityColor = (score) => {
    const colors = {
      0: 'border-gray-300 bg-gray-50 text-gray-700',
      1: 'border-red-300 bg-red-50 text-red-700',
      2: 'border-orange-300 bg-orange-50 text-orange-700',
      3: 'border-yellow-300 bg-yellow-50 text-yellow-700',
      4: 'border-blue-300 bg-blue-50 text-blue-700',
      5: 'border-green-300 bg-green-50 text-green-700'
    };
    return colors[score] || colors[0];
  };

  const getMaturitySelectedColor = (score) => {
    const colors = {
      0: 'border-gray-500 bg-gray-100 text-gray-900',
      1: 'border-red-500 bg-red-100 text-red-900',
      2: 'border-orange-500 bg-orange-100 text-orange-900',
      3: 'border-yellow-500 bg-yellow-100 text-yellow-900',
      4: 'border-blue-500 bg-blue-100 text-blue-900',
      5: 'border-green-500 bg-green-100 text-green-900'
    };
    return colors[score] || colors[0];
  };

  const getQuestionsForComponent = (componentId) =>
    questions.filter(question => question.focus_area?.component?.id === componentId);

  const getCompletionStats = () => {
    const totalQuestions = questions.length;
    let completedQuestions = 0;

    if (user?.role === 'business_unit_champion') {
      // For business_unit_champion, require both score and evidence
      completedQuestions = Object.values(responses).filter(r =>
        r.score !== undefined &&
        r.score !== null &&
        r.evidence &&
        r.evidence.length > 0
      ).length;
    } else {
      // For other roles, only score is required
      completedQuestions = Object.values(responses).filter(r =>
        r.score !== undefined && r.score !== null
      ).length;
    }

    const completionPercentage = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;
    return { answeredQuestions: completedQuestions, totalQuestions, completionPercentage };
  };

  const { answeredQuestions, totalQuestions, completionPercentage } = getCompletionStats();

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 rounded-xl shadow-xl p-8 text-white">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded w-64 mb-4"></div>
            <div className="h-4 bg-white/20 rounded w-96"></div>
          </div>
        </div>

        {/* Progress Skeleton */}
        <div className="bg-white shadow-xl rounded-xl border border-gray-100 p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="bg-white shadow-xl rounded-xl border border-gray-100">
          <div className="animate-pulse">
            <div className="h-16 bg-gray-50 border-b border-gray-200"></div>
          </div>
        </div>

        {/* Questions Skeleton */}
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white shadow-xl rounded-xl border border-gray-100 p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
                <div className="grid grid-cols-6 gap-2 mb-4">
                  {[0,1,2,3,4,5].map(j => (
                    <div key={j} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-8">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-red-800">Error Loading Assessment</h3>
            <p className="mt-2 text-red-700">{error}</p>
            <button
              onClick={fetchAssessmentData}
              className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-8">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <DocumentTextIcon className="h-8 w-8 text-gray-400" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-800">Assessment Not Found</h3>
            <p className="mt-2 text-gray-600">The assessment you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => navigate('/assessments')}
              className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Assessments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Sticky Header and Controls */}
      <div className="sticky top-0 z-50 bg-white shadow-lg border-b border-gray-200">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 rounded-xl shadow-xl overflow-hidden mx-4 mt-4">
          <div className="px-8 py-8 text-white">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <button
                    onClick={() => navigate('/assessments')}
                    className="inline-flex items-center px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold rounded-lg hover:bg-white/30 transition-all duration-200"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Back
                  </button>
                  <div className="flex items-center space-x-2">
                    <BuildingOfficeIcon className="h-5 w-5" />
                    <span className="text-sm">{assessment.organization?.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UsersIcon className="h-5 w-5" />
                    <span className="text-sm">{assessment.department?.name}</span>
                  </div>
                </div>
                <h1 className="text-3xl font-bold mb-2">{assessment.name}</h1>
                <p className="text-indigo-100 text-lg mb-4">
                  Reference: {assessment.reference_number} • Due: {assessment.due_date ? new Date(assessment.due_date).toLocaleDateString() : 'N/A'}
                </p>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <ChartBarIcon className="h-4 w-4" />
                    <span>{answeredQuestions} of {totalQuestions} questions answered</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-4 w-4" />
                    <span>Status: {assessment.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  </div>
                  {/* Auto-save status */}
                  <div className="flex items-center space-x-2">
                    {autoSaving ? (
                      <>
                        <ClockIcon className="h-4 w-4 animate-spin" />
                        <span className="text-indigo-200">Auto-saving...</span>
                      </>
                    ) : lastSaved ? (
                      <>
                        <CheckCircleIcon className="h-4 w-4" />
                        <span className="text-indigo-200">
                          Last saved: {lastSaved.toLocaleTimeString()}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {/* Manual Save Button */}
                {user?.role === 'business_unit_champion' && (
                  <button
                    onClick={handleManualSave}
                    disabled={saving || autoSaving}
                    className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold rounded-lg hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 shadow-lg disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Save Progress
                      </>
                    )}
                  </button>
                )}
                {/* Submit Button */}
                {user?.role === 'business_unit_champion' && (
                  <button
                    onClick={handleSubmit}
                    disabled={saving || autoSaving}
                    className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 shadow-lg disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <ClockIcon className="h-5 w-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Submit Assessment
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white shadow-xl rounded-xl border border-gray-100 p-6 mx-4 my-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Assessment Progress</h2>
            <span className="text-sm font-medium text-gray-600">{completionPercentage}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-indigo-500 to-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>{answeredQuestions} questions answered</span>
            <span>{totalQuestions} total questions</span>
          </div>
        </div>

        {/* Component Tabs */}
        <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden mx-4 mb-4">
          <nav className="flex space-x-1 px-6 bg-gray-50 border-b border-gray-200">
            {components.map((component) => {
              const isActive = activeComponent === component.id;
              const questionCount = getQuestionsForComponent(component.id).length;
              const answeredCount = getQuestionsForComponent(component.id).filter(q =>
                responses[q.id]?.score !== undefined
              ).length;

              return (
                <button
                  key={component.id}
                  onClick={() => setActiveComponent(component.id)}
                  className={`py-4 px-6 border-b-2 font-semibold text-sm transition-all duration-200 ${
                    isActive
                      ? 'border-indigo-500 text-indigo-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{component.name}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      answeredCount === questionCount && questionCount > 0
                        ? 'bg-green-100 text-green-800'
                        : answeredCount > 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {answeredCount}/{questionCount}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6 px-4">
        {getQuestionsForComponent(activeComponent).map((question, index) => {
          const questionNumber = questions.findIndex(q => q.id === question.id) + 1;
          const hasGuidance = question.guidance || question.examples;
          const showQuestionGuidance = showGuidance[question.id];

          return (
            <div key={question.id} className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300">
              {/* Question Header */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-800 text-sm font-bold rounded-full">
                        {questionNumber}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                        {question.text}
                      </h3>
                    </div>
                    {question.focus_area && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <InformationCircleIcon className="h-4 w-4" />
                        <span>Focus Area: {question.focus_area.name}</span>
                      </div>
                    )}
                  </div>
                  {hasGuidance && (
                    <button
                      onClick={() => setShowGuidance(prev => ({ ...prev, [question.id]: !prev[question.id] }))}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <InformationCircleIcon className="h-3 w-3 mr-1" />
                      {showQuestionGuidance ? 'Hide' : 'Show'} Guidance
                    </button>
                  )}
                </div>
              </div>

              {/* Guidance Section */}
              {showQuestionGuidance && hasGuidance && (
                <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
                  <div className="space-y-3">
                    {question.guidance && (
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900 mb-1">Guidance:</h4>
                        <p className="text-sm text-blue-800">{question.guidance}</p>
                      </div>
                    )}
                    {question.examples && (
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900 mb-1">Examples:</h4>
                        <p className="text-sm text-blue-800">{question.examples}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Question Content */}
              <div className="p-6 space-y-6">
                {/* Maturity Score Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center">
                    <ChartBarIcon className="h-4 w-4 mr-2" />
                    Maturity Score *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[0,1,2,3,4,5].map(score => {
                      const isSelected = responses[question.id]?.score === score;
                      return (
                        <label key={score} className="relative">
                          <input
                            type="radio"
                            name={`score-${question.id}`}
                            value={score}
                            checked={isSelected}
                            onChange={(e) => handleResponseChange(question.id, 'score', parseInt(e.target.value))}
                            className="sr-only"
                            disabled={user?.role !== 'business_unit_champion'}
                          />
                          <div className={`p-4 border-2 rounded-xl text-center cursor-pointer transition-all duration-200 hover:shadow-md ${
                            isSelected
                              ? `${getMaturitySelectedColor(score)} ring-2 ring-offset-2 ring-indigo-500`
                              : `${getMaturityColor(score)} hover:border-indigo-300`
                          } ${user?.role !== 'business_unit_champion' ? 'opacity-60 cursor-not-allowed' : ''}`}>
                            <div className="text-2xl font-bold mb-1">{score}</div>
                            <div className="text-xs font-medium leading-tight">{getMaturityDescription(score)}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Comments Section */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Comments
                  </label>
                  <textarea
                    value={responses[question.id]?.comments || ''}
                    onChange={(e) => handleResponseChange(question.id, 'comments', e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                    placeholder="Add your comments and observations here..."
                    disabled={user?.role !== 'business_unit_champion'}
                  />
                </div>

                {/* File Upload Section */}
                {user?.role === 'business_unit_champion' && (
                  <>
                    <FileUploadInput questionId={question.id} />

                    {/* Uploaded Files Display */}
                    {responses[question.id]?.evidence?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <PaperClipIcon className="h-4 w-4 mr-2" />
                          Uploaded Evidence ({responses[question.id].evidence.length} files)
                        </h4>
                        <div className="space-y-2">
                          {responses[question.id].evidence.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center space-x-3">
                                <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {file.file_name || file.filename || `File ${idx + 1}`}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Uploaded {file.uploaded_at ? new Date(file.uploaded_at).toLocaleDateString() : 'Recently'}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  // Remove file functionality could be added here
                                  console.log('Remove file:', file.id);
                                }}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-semibold text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto flex-shrink-0"
            >
              <XMarkIcon className="h-5 w-5 text-red-400 hover:text-red-600 transition-colors" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}