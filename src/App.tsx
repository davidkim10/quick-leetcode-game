import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import QuestionCard from './components/QuestionCard';
import questions from './questions.json';
// import './App.css';

// Define the Question interface based on questions.json structure
interface Question {
  difficulty: string;
  title: string;
  description: string;
  examples: { input: string; output: string }[];
  topic: string;
  hints: string[];
  breakdown: string;
  initialCode: string;
  solutionCode: string;
  testConfig: {
    functionName: string;
    inputs: { name: string; parse: string; type: string }[];
    outputType: string;
  };
}

function App() {
  const [progress, setProgress] = useState<number>(0);
  const totalQuestions: number = questions.length;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  const handleSolve = (): void => {
    const nextIndex = currentQuestionIndex + 1;
    setProgress((nextIndex / totalQuestions) * 100);
    setCurrentQuestionIndex(nextIndex);
    console.log(`Moving to question ${nextIndex}/${totalQuestions}`);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">
        Code Quest: Level Up Your Skills
      </h1>
      <div className="mb-6">
        <p className="text-lg mb-2">Progress: {Math.round(progress)}%</p>
        <Progress value={progress} className="w-full" />
      </div>
      {currentQuestionIndex < questions.length ? (
        <QuestionCard
          question={questions[currentQuestionIndex] as Question}
          onSolve={handleSolve}
        />
      ) : (
        <p className="text-xl text-center">
          Congratulations! You've completed the game!
        </p>
      )}
    </div>
  );
}

export default App;
