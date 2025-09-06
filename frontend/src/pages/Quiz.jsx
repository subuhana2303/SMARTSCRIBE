const { useState, useEffect } = React;
const { useParams, useNavigate } = ReactRouterDOM;
import { api } from '../lib/api.js';

function Quiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const fetchQuiz = async () => {
    try {
      // For demo purposes, we'll simulate fetching a quiz
      // In reality, this would fetch from an endpoint that gets quiz by ID
      const response = await api.get(`/content`);
      
      // Simulate quiz data structure
      const mockQuiz = {
        id: id,
        content_id: 'mock-content-id',
        questions: [
          {
            question: "What is the main topic discussed in this content?",
            options: [
              { option: "A", text: "Technology and innovation" },
              { option: "B", text: "Historical events" },
              { option: "C", text: "Scientific research" },
              { option: "D", text: "Educational methodology" }
            ],
            correct_answer: "A"
          },
          {
            question: "Which concept is emphasized most in the material?",
            options: [
              { option: "A", text: "Theoretical frameworks" },
              { option: "B", text: "Practical applications" },
              { option: "C", text: "Case studies" },
              { option: "D", text: "Statistical analysis" }
            ],
            correct_answer: "B"
          },
          {
            question: "What is the recommended approach mentioned?",
            options: [
              { option: "A", text: "Traditional methods" },
              { option: "B", text: "Modern techniques" },
              { option: "C", text: "Hybrid approach" },
              { option: "D", text: "Experimental methods" }
            ],
            correct_answer: "C"
          }
        ],
        created_at: new Date().toISOString()
      };
      
      setQuiz(mockQuiz);
      setAnswers({});
    } catch (error) {
      setError('Failed to load quiz');
      console.error('Error fetching quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex, selectedOption) => {
    setAnswers({
      ...answers,
      [questionIndex]: selectedOption
    });
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const submissionData = {
        answers: quiz.questions.map((_, index) => answers[index] || '')
      };

      const response = await api.post(`/quiz/${id}/submit`, submissionData);
      setResult(response.data);
      setSubmitted(true);
    } catch (error) {
      setError('Failed to submit quiz');
      console.error('Error submitting quiz:', error);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setSubmitted(false);
    setResult(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Quiz not found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/app')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (submitted && result) {
    const percentage = Math.round(result.score);
    const getScoreColor = (score) => {
      if (score >= 80) return 'text-green-600 dark:text-green-400';
      if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
      return 'text-red-600 dark:text-red-400';
    };

    const getScoreBgColor = (score) => {
      if (score >= 80) return 'bg-green-100 dark:bg-green-900/20';
      if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20';
      return 'bg-red-100 dark:bg-red-900/20';
    };

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreBgColor(percentage)} mb-6`}>
            <span className={`text-3xl font-bold ${getScoreColor(percentage)}`}>
              {percentage}%
            </span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quiz Complete!</h1>
          <p className="text-gray-600 dark:text-gray-400">
            You scored {result.correct_answers} out of {result.total_questions} questions correctly
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Results Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{result.total_questions}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{result.correct_answers}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Correct Answers</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(percentage)}`}>{percentage}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Final Score</div>
            </div>
          </div>

          <div className="space-y-4">
            {quiz.questions.map((question, index) => {
              const userAnswer = answers[index];
              const isCorrect = userAnswer === question.correct_answer;
              
              return (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      isCorrect ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                    }`}>
                      {isCorrect ? (
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        {index + 1}. {question.question}
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div className={`${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          Your answer: {question.options.find(opt => opt.option === userAnswer)?.text || 'No answer'}
                        </div>
                        {!isCorrect && (
                          <div className="text-green-600 dark:text-green-400">
                            Correct answer: {question.options.find(opt => opt.option === question.correct_answer)?.text}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={restartQuiz}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Retake Quiz
          </button>
          <button
            onClick={() => navigate('/app')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const question = quiz.questions[currentQuestion];
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;
  const allQuestionsAnswered = quiz.questions.every((_, index) => answers[index]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quiz</h1>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {question.question}
        </h2>

        <div className="space-y-3">
          {question.options.map((option) => (
            <label
              key={option.option}
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                answers[currentQuestion] === option.option
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <input
                type="radio"
                name={`question-${currentQuestion}`}
                value={option.option}
                checked={answers[currentQuestion] === option.option}
                onChange={() => handleAnswerSelect(currentQuestion, option.option)}
                className="sr-only"
              />
              <div className={`flex-shrink-0 w-5 h-5 border-2 rounded-full mr-3 ${
                answers[currentQuestion] === option.option
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {answers[currentQuestion] === option.option && (
                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                )}
              </div>
              <div className="flex-1">
                <span className="font-medium text-gray-900 dark:text-white mr-2">
                  {option.option}.
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {option.text}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Previous</span>
        </button>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          {Object.keys(answers).length} of {quiz.questions.length} answered
        </div>

        {isLastQuestion ? (
          <button
            onClick={handleSubmit}
            disabled={!allQuestionsAnswered}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <span>Submit Quiz</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!answers[currentQuestion]}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <span>Next</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}

export default Quiz;
