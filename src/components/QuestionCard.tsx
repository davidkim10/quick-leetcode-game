import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-monokai';

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

interface QuestionCardProps {
  question: Question;
  onSolve: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onSolve }) => {
  const [showHints, setShowHints] = useState<boolean>(false);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [code, setCode] = useState<string>(question.initialCode);
  const [result, setResult] = useState<string>('');

  useEffect(() => {
    setCode(question.initialCode);
    setResult('');
    setShowHints(false);
    setShowBreakdown(false);
    setShowSolution(false);
  }, [question]);

  const parseInput = (
    inputString: string,
    inputConfig: { name: string; parse: string; type: string }
  ): any => {
    const regex = new RegExp(inputConfig.parse, 'i');
    const match = inputString.match(regex);
    if (!match) {
      throw new Error(
        `Failed to parse ${inputConfig.name} from "${inputString}" with regex ${inputConfig.parse}`
      );
    }
    const value = match[1].trim();
    switch (inputConfig.type) {
      case 'array':
        return value === ''
          ? []
          : value
              .split(',')
              .map((item) =>
                isNaN(item.trim()) ? item.trim() : Number(item.trim())
              );
      case 'number':
        return Number(value);
      case 'string':
        return value;
      default:
        throw new Error(`Unsupported input type: ${inputConfig.type}`);
    }
  };

  const validateOutput = (
    result: any,
    expected: string,
    outputType: string
  ): boolean => {
    switch (outputType) {
      case 'array':
        return JSON.stringify(result) === expected;
      case 'number':
        return result === Number(expected);
      case 'boolean':
        return result === (expected === 'true');
      default:
        throw new Error(`Unsupported output type: ${outputType}`);
    }
  };

  const handleRunCode = (): void => {
    try {
      const userFn = new Function(`return ${code}`)() as (
        ...args: any[]
      ) => any;
      if (typeof userFn !== 'function') {
        throw new Error(
          `Code must define a function named '${question.testConfig.functionName}'`
        );
      }

      let allTestsPassed = true;
      const testResults: string[] = [];

      question.examples.forEach((ex, idx) => {
        const inputs = question.testConfig.inputs.map((inputConfig) =>
          parseInput(ex.input, inputConfig)
        );
        const expected = ex.output;

        const result = userFn(...inputs);

        const passed = validateOutput(
          result,
          expected,
          question.testConfig.outputType
        );
        testResults.push(
          `Test ${idx + 1}: ${
            passed ? 'Passed' : 'Failed'
          } (Expected: ${expected}, Got: ${JSON.stringify(result)})`
        );
        if (!passed) allTestsPassed = false;
      });

      if (allTestsPassed) {
        setResult('All tests passed! Moving to next question...');
        setTimeout(onSolve, 1000);
      } else {
        setResult(testResults.join('\n'));
      }
    } catch (error) {
      setResult(`Error: ${(error as Error).message}`);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>
          {question.title} ({question.difficulty})
        </CardTitle>
        <p className="text-sm text-muted-foreground">Topic: {question.topic}</p>
      </CardHeader>
      <CardContent>
        <p className="mb-4">{question.description}</p>
        <h3 className="text-lg font-semibold mb-2">Examples:</h3>
        {question.examples.map((ex, idx) => (
          <p key={idx} className="mb-1">
            Input: {ex.input} → Output: {ex.output}
          </p>
        ))}
        <AceEditor
          mode="javascript"
          theme="monokai"
          value={code}
          onChange={(newCode) => setCode(newCode)}
          name="code-editor"
          editorProps={{ $blockScrolling: true }}
          className="w-full h-48 mt-4 rounded-md border"
        />
        <div className="mt-4 flex gap-2">
          <Button onClick={handleRunCode}>Run Code</Button>
          <Button variant="outline" onClick={() => setShowHints(!showHints)}>
            {showHints ? 'Hide Hints' : 'Show Hints'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowBreakdown(!showBreakdown)}
          >
            {showBreakdown ? 'Hide Breakdown' : 'Show Breakdown'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowSolution(!showSolution)}
          >
            {showSolution ? 'Hide Solution' : 'Show Solution'}
          </Button>
        </div>
        <pre className="mt-2 text-sm whitespace-pre-wrap">{result}</pre>
        <Collapsible open={showHints}>
          <CollapsibleContent>
            <h3 className="text-lg font-semibold mt-4">Hints:</h3>
            {question.hints.map((hint, idx) => (
              <p key={idx}>- {hint}</p>
            ))}
          </CollapsibleContent>
        </Collapsible>
        <Collapsible open={showBreakdown}>
          <CollapsibleContent>
            <h3 className="text-lg font-semibold mt-4">Breakdown:</h3>
            <p>{question.breakdown}</p>
          </CollapsibleContent>
        </Collapsible>
        <Collapsible open={showSolution}>
          <CollapsibleContent>
            <h3 className="text-lg font-semibold mt-4">Solution:</h3>
            <AceEditor
              mode="javascript"
              theme="monokai"
              value={question.solutionCode}
              readOnly={true}
              name="solution-editor"
              editorProps={{ $blockScrolling: true }}
              className="w-full h-48 mt-2 rounded-md border"
            />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
