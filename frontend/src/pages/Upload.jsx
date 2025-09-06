const { useState } = React;
const { useNavigate } = ReactRouterDOM;
import { api } from '../lib/api.js';

function Upload() {
  const [uploadType, setUploadType] = useState('file'); // 'file' or 'youtube'
  const [file, setFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  
  const navigate = useNavigate();

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    if (!title && selectedFile) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, "")); // Remove extension
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const videoFile = droppedFiles.find(file => 
      file.type.startsWith('video/') || file.type.startsWith('audio/')
    );
    
    if (videoFile) {
      handleFileSelect(videoFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      
      if (uploadType === 'file' && file) {
        formData.append('file', file);
      } else if (uploadType === 'youtube' && youtubeUrl) {
        formData.append('youtube_url', youtubeUrl);
      } else {
        throw new Error('Please provide either a file or YouTube URL');
      }

      const response = await api.post('/content/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Redirect to content detail page
      navigate(`/content/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Content</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Upload a video file or paste a YouTube URL to generate summaries and quizzes.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Choose upload method
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setUploadType('file')}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  uploadType === 'file'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <svg className="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="font-medium text-gray-900 dark:text-white">Upload File</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Video or audio file</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setUploadType('youtube')}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  uploadType === 'youtube'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span className="font-medium text-gray-900 dark:text-white">YouTube Link</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Paste YouTube URL</span>
                </div>
              </button>
            </div>
          </div>

          {/* File Upload */}
          {uploadType === 'file' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Video/Audio File
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {file ? (
                  <div className="space-y-2">
                    <svg className="w-12 h-12 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-600 dark:text-gray-400">
                      Drag and drop your video file here, or{' '}
                      <label className="text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer">
                        browse
                        <input
                          type="file"
                          className="hidden"
                          accept="video/*,audio/*"
                          onChange={(e) => handleFileSelect(e.target.files[0])}
                        />
                      </label>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Supports MP4, MOV, AVI, MP3, WAV and more
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* YouTube URL */}
          {uploadType === 'youtube' && (
            <div>
              <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                YouTube URL
              </label>
              <input
                id="youtube-url"
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Paste a YouTube video URL to process its content
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title for your content"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || (!file && !youtubeUrl) || !title}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Upload & Process</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Processing Info */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">What happens next?</h3>
            <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• AI will transcribe your audio content</li>
              <li>• Generate an intelligent summary</li>
              <li>• Create interactive quizzes</li>
              <li>• Enable multilingual translation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Upload;
