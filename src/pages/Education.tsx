import React, { useState } from 'react';
import {
  GraduationCap,
  PlayCircle,
  CheckCircle,
  Clock,
  BookOpen,
  Award,
  ArrowRight,
  FileText,
  Calculator,
  Target,
  ChevronRight,
  X,
  AlertCircle
} from 'lucide-react';
import { educationContent, Question } from '../data/educationContent';

const courseModules = [
  {
    id: 1,
    title: 'IFRS 16 Fundamentals',
    description: 'Scope, exemptions, key definitions, and initial recognition principles.',
    duration: '30 min',
    level: 'Beginner',
    modules: 5,
    progress: 0,
    topics: [
      'Scope & exemptions',
      'Lease definitions',
      'Initial recognition',
      'Subsequent measurement',
      'Disclosures'
    ]
  },
  {
    id: 2,
    title: 'Lease Data Intake & Contract Interpretation',
    description: 'Identify lease components, determine term, classify payments.',
    duration: '25 min',
    level: 'Beginner',
    modules: 5,
    progress: 0,
    topics: [
      'Lease vs non-lease components',
      'Lease term determination',
      'Payment classification',
      'IDC & incentives',
      'Common pitfalls'
    ]
  },
  {
    id: 3,
    title: 'Liability & ROU Modelling',
    description: 'Cashflow building, discounting, measurement, and remeasurements.',
    duration: '35 min',
    level: 'Intermediate',
    modules: 5,
    progress: 0,
    topics: [
      'Cashflow schedules',
      'Discount rate application',
      'Initial measurement',
      'Remeasurements',
      'Worked examples'
    ]
  },
  {
    id: 4,
    title: 'Journal Entries & Reporting',
    description: 'Accounting entries, financial statement impacts, and disclosures.',
    duration: '20 min',
    level: 'Intermediate',
    modules: 4,
    progress: 0,
    topics: [
      'Lessee accounting entries',
      'ROU depreciation',
      'P&L impacts',
      'Disclosure requirements'
    ]
  },
  {
    id: 5,
    title: 'Advanced Modelling & Automation',
    description: 'Portfolio modelling, scenarios, and automation controls.',
    duration: '40 min',
    level: 'Advanced',
    modules: 6,
    progress: 0,
    topics: [
      'Portfolio modelling',
      'Scenario analysis',
      'Lease modifications',
      'Automation opportunities',
      'System integration',
      'Controls'
    ]
  }
];

const achievements = [
  { id: 1, title: 'First Module Completed', completed: false, date: null },
  { id: 2, title: 'Intermediate Learner', completed: false, date: null },
  { id: 3, title: 'Advanced Modeller', completed: false, date: null }
];

const assessmentResults = [
  { module: 'IFRS 16 Fundamentals - Quiz 1', score: 0, maxScore: 100, passed: false }
];

export function Education() {
  const [activeTab, setActiveTab] = useState('courses');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Get module content
  const getModuleContent = (moduleId: number) => {
    return educationContent.find(content => content.moduleId === moduleId);
  };

  // Handle starting a topic
  const handleStartTopic = (index: number) => {
    setSelectedTopicIndex(index);
    setShowQuiz(false);
  };

  // Handle starting quiz
  const handleStartQuiz = () => {
    setShowQuiz(true);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setSelectedTopicIndex(null);
  };

  // Handle quiz answer selection
  const handleQuizAnswer = (questionId: number, answerIndex: number) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  // Handle quiz submission
  const handleSubmitQuiz = () => {
    if (!selectedCourse) return;

    const moduleContent = getModuleContent(selectedCourse.id);
    if (!moduleContent) return;

    let correct = 0;
    moduleContent.quiz.forEach((question) => {
      if (quizAnswers[question.id] === question.correctAnswer) {
        correct++;
      }
    });

    const score = Math.round((correct / moduleContent.quiz.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  // Reset quiz
  const handleResetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  // Back to course overview
  const handleBackToCourse = () => {
    setSelectedTopicIndex(null);
    setShowQuiz(false);
    setQuizSubmitted(false);
  };

  return (
    <div className="w-full px-6 py-6 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-lg">
            <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Teach Yourself IFRS 16</h1>
            <p className="text-slate-600 dark:text-white/80">Interactive e-learning course with certification</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-300 dark:border-white/10 mb-8">
        <nav className="flex space-x-8">
          {['courses', 'progress', 'achievements'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300'
                  : 'border-transparent text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white/90 hover:border-slate-400 dark:hover:border-white/30'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {!selectedCourse ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courseModules.map((course) => (
                <div
                  key={course.id}
                  className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg shadow-xl border border-slate-300 dark:border-white/10 p-6 hover:shadow-2xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-lg">
                        <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{course.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          course.level === 'Beginner' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' :
                          course.level === 'Intermediate' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300' :
                          'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
                        }`}>
                          {course.level}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-600 dark:text-white/80 text-sm mb-4">{course.description}</p>

                  <div className="flex items-center justify-between text-sm text-slate-600 dark:text-white/70 mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="h-4 w-4" />
                      <span>{course.modules} modules</span>
                    </div>
                  </div>

                  <div className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm">
                    <span>{course.progress > 0 ? 'Continue Course' : 'Start Course'}</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : selectedTopicIndex !== null && selectedCourse ? (
            // Topic Detail View
            (() => {
              const moduleContent = getModuleContent(selectedCourse.id);
              if (!moduleContent) return null;
              const topic = moduleContent.topics[selectedTopicIndex];

              return (
                <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg shadow-xl border border-slate-300 dark:border-white/10 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{topic.title}</h2>
                    <button
                      onClick={handleBackToCourse}
                      className="flex items-center gap-2 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                      Close
                    </button>
                  </div>

                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-lg text-slate-700 dark:text-white/90 leading-relaxed mb-6">
                      {topic.content}
                    </p>

                    <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-6 mb-6">
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Key Points
                      </h3>
                      <ul className="space-y-2">
                        {topic.keyPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-white/80">
                            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {topic.example && (
                      <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg p-6 mb-6">
                        <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-200 mb-3 flex items-center gap-2">
                          <Calculator className="w-5 h-5" />
                          Practical Example
                        </h3>
                        <p className="text-slate-700 dark:text-white/80 leading-relaxed whitespace-pre-line">
                          {topic.example}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between mt-8">
                    <button
                      onClick={() => selectedTopicIndex > 0 && handleStartTopic(selectedTopicIndex - 1)}
                      disabled={selectedTopicIndex === 0}
                      className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous Topic
                    </button>
                    <button
                      onClick={() => selectedTopicIndex < moduleContent.topics.length - 1 ? handleStartTopic(selectedTopicIndex + 1) : handleBackToCourse()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {selectedTopicIndex < moduleContent.topics.length - 1 ? 'Next Topic' : 'Back to Overview'}
                    </button>
                  </div>
                </div>
              );
            })()
          ) : showQuiz && selectedCourse ? (
            // Quiz View
            (() => {
              const moduleContent = getModuleContent(selectedCourse.id);
              if (!moduleContent) return null;

              return (
                <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg shadow-xl border border-slate-300 dark:border-white/10 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {selectedCourse.title} - Quiz
                    </h2>
                    <button
                      onClick={handleBackToCourse}
                      className="flex items-center gap-2 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                      Close
                    </button>
                  </div>

                  {!quizSubmitted ? (
                    <div className="space-y-8">
                      {moduleContent.quiz.map((question, qIndex) => (
                        <div key={question.id} className="border border-slate-300 dark:border-white/10 rounded-lg p-6 bg-slate-50 dark:bg-white/5">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Question {qIndex + 1}: {question.question}
                          </h3>
                          <div className="space-y-3">
                            {question.options.map((option, optIndex) => (
                              <label
                                key={optIndex}
                                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                  quizAnswers[question.id] === optIndex
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/20'
                                    : 'border-slate-300 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${question.id}`}
                                  checked={quizAnswers[question.id] === optIndex}
                                  onChange={() => handleQuizAnswer(question.id, optIndex)}
                                  className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-slate-900 dark:text-white">{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div className="flex justify-center gap-4">
                        <button
                          onClick={handleBackToCourse}
                          className="px-8 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSubmitQuiz}
                          disabled={Object.keys(quizAnswers).length !== moduleContent.quiz.length}
                          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Submit Quiz
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Quiz Results
                    <div>
                      <div className={`p-6 rounded-lg mb-8 ${
                        quizScore >= 70
                          ? 'bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30'
                          : 'bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30'
                      }`}>
                        <div className="flex items-center justify-center mb-4">
                          {quizScore >= 70 ? (
                            <CheckCircle className="w-16 h-16 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <AlertCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <h3 className={`text-2xl font-bold text-center mb-2 ${
                          quizScore >= 70 ? 'text-emerald-900 dark:text-emerald-200' : 'text-red-900 dark:text-red-200'
                        }`}>
                          {quizScore >= 70 ? 'Congratulations!' : 'Keep Learning!'}
                        </h3>
                        <p className={`text-center text-lg ${
                          quizScore >= 70 ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'
                        }`}>
                          Your Score: {quizScore}% ({Object.values(quizAnswers).filter((ans, idx) => ans === moduleContent.quiz[idx].correctAnswer).length}/{moduleContent.quiz.length} correct)
                        </p>
                        <p className={`text-center mt-2 ${
                          quizScore >= 70 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
                        }`}>
                          {quizScore >= 70 ? 'You passed! Well done!' : 'You need 70% to pass. Review the material and try again.'}
                        </p>
                      </div>

                      <div className="space-y-6 mb-8">
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Review Answers</h3>
                        {moduleContent.quiz.map((question, qIndex) => {
                          const userAnswer = quizAnswers[question.id];
                          const isCorrect = userAnswer === question.correctAnswer;

                          return (
                            <div key={question.id} className="border border-slate-300 dark:border-white/10 rounded-lg p-6 bg-slate-50 dark:bg-white/5">
                              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                                Question {qIndex + 1}: {question.question}
                              </h4>
                              <div className="space-y-2 mb-4">
                                {question.options.map((option, optIndex) => (
                                  <div
                                    key={optIndex}
                                    className={`p-3 rounded-lg ${
                                      optIndex === question.correctAnswer
                                        ? 'bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30'
                                        : optIndex === userAnswer && !isCorrect
                                        ? 'bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-500/30'
                                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {optIndex === question.correctAnswer && (
                                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                      )}
                                      {optIndex === userAnswer && !isCorrect && (
                                        <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                                      )}
                                      <span className="text-slate-900 dark:text-white">{option}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">Explanation:</p>
                                <p className="text-sm text-blue-800 dark:text-blue-300">{question.explanation}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-center gap-4">
                        <button
                          onClick={handleBackToCourse}
                          className="px-8 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                          Back to Course
                        </button>
                        <button
                          onClick={handleResetQuiz}
                          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Retake Quiz
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            // Course Overview
            <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg shadow-xl border border-slate-300 dark:border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedCourse.title}</h2>
                  <p className="text-slate-600 dark:text-white/80 mt-1">{selectedCourse.description}</p>
                </div>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
                >
                  Back to Courses
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                  { label: 'Duration', value: selectedCourse.duration, icon: Clock, color: 'blue' },
                  { label: 'Topics', value: selectedCourse.topics.length, icon: FileText, color: 'emerald' },
                  { label: 'Level', value: selectedCourse.level, icon: Target, color: 'amber' },
                  { label: 'Progress', value: `${selectedCourse.progress}%`, icon: Calculator, color: 'purple' }
                ].map((info, idx) => {
                  const Icon = info.icon;
                  return (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-center border border-slate-200 dark:border-white/10">
                      <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600 dark:text-white/70 font-medium">{info.label}</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{info.value}</p>
                    </div>
                  );
                })}
              </div>

              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Course Content</h3>
              <div className="space-y-3 mb-8">
                {(() => {
                  const moduleContent = getModuleContent(selectedCourse.id);
                  if (!moduleContent) return null;

                  return moduleContent.topics.map((topic, index) => (
                    <button
                      key={index}
                      onClick={() => handleStartTopic(index)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/10 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-500/20 rounded-full">
                          <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">{index + 1}</span>
                        </div>
                        <span className="text-left text-slate-800 dark:text-white/90 font-medium">{topic.title}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 dark:text-white/50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    </button>
                  ));
                })()}
              </div>

              <div className="mt-8 flex justify-center gap-4">
                <button
                  onClick={handleStartQuiz}
                  className="bg-blue-600 dark:bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors font-medium shadow-xl flex items-center gap-2"
                >
                  <Target className="w-5 h-5" />
                  Take Quiz
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg shadow-xl border border-slate-300 dark:border-white/10 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Learning Progress</h2>
            <div className="space-y-4">
              {courseModules.map((course) => (
                <div key={course.id} className="border border-slate-300 dark:border-white/10 rounded-lg p-4 bg-slate-50 dark:bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-slate-900 dark:text-white">{course.title}</h3>
                    <span className="text-sm text-slate-600 dark:text-white/80">{course.progress}% Complete</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-3">
                    <div
                      className="bg-blue-500 dark:bg-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 text-sm text-slate-600 dark:text-white/70">
                    {course.progress > 0 ? `${Math.floor(course.progress / (100 / course.modules))} of ${course.modules} modules completed` : 'Not started'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg shadow-xl border border-slate-300 dark:border-white/10 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Assessment Results</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-300 dark:divide-white/10">
                <thead className="bg-slate-100 dark:bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-white/80 uppercase tracking-wider">
                      Assessment
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 dark:text-white/80 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 dark:text-white/80 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-white/5 divide-y divide-slate-200 dark:divide-white/10">
                  {assessmentResults.map((result, index) => (
                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-white/10">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">{result.module}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span className="font-medium text-slate-900 dark:text-white">{result.score}</span>
                        <span className="text-slate-600 dark:text-white/70">/{result.maxScore}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          result.passed ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
                        }`}>
                          {result.passed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg shadow-xl border border-slate-300 dark:border-white/10 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Your Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`border rounded-lg p-6 ${
                    achievement.completed
                      ? 'border-emerald-300 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-500/20'
                      : 'border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`${achievement.completed ? 'bg-emerald-100 dark:bg-emerald-500/30' : 'bg-slate-200 dark:bg-white/10'} p-3 rounded-full`}>
                      <Award className={`h-6 w-6 ${achievement.completed ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-400 dark:text-white/50'}`} />
                    </div>
                    <div>
                      <h3 className={`font-medium ${achievement.completed ? 'text-emerald-800 dark:text-emerald-100' : 'text-slate-600 dark:text-white/70'}`}>
                        {achievement.title}
                      </h3>
                      {achievement.completed && achievement.date ? (
                        <p className="text-sm text-emerald-600 dark:text-emerald-300">Earned on {achievement.date}</p>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-white/60">Not yet earned</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600 dark:to-blue-700 rounded-lg p-6 text-white shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Keep Learning!</h3>
            <p className="text-blue-100 dark:text-blue-100 mb-4">
              Complete more courses and assessments to unlock new achievements and demonstrate your IFRS 16 expertise.
            </p>
            <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              Continue Learning
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
