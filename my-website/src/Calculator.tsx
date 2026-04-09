import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

const MULTIPLY = '×';
const DIVIDE = '÷';

export default function App() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [heardText, setHeardText] = useState('');
  const [liveText, setLiveText] = useState('');
  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);
  const synthesizerRef = useRef<SpeechSDK.SpeechSynthesizer | null>(null);
  const displayRef = useRef(display);
  const expressionRef = useRef(expression);
  const lastResultRef = useRef(lastResult);

  const SPEECH_KEY = import.meta.env.VITE_AZURE_SPEECH_KEY;
  const SPEECH_REGION = import.meta.env.VITE_AZURE_SPEECH_REGION;
  const TTS_VOICE = 'en-US-Ava:DragonHDLatestNeural';

  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.close();
        recognizerRef.current = null;
      }
      if (synthesizerRef.current) {
        synthesizerRef.current.close();
        synthesizerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    displayRef.current = display;
  }, [display]);

  useEffect(() => {
    expressionRef.current = expression;
  }, [expression]);

  useEffect(() => {
    lastResultRef.current = lastResult;
  }, [lastResult]);

  const stopListening = () => {
    recognizerRef.current?.stopContinuousRecognitionAsync(() => {
      recognizerRef.current?.close();
      recognizerRef.current = null;
      setIsListening(false);
      setLiveText('');
    });
  };

  const formatForSpeech = (text: string) =>
    text
      .replaceAll(MULTIPLY, ' times ')
      .replaceAll(DIVIDE, ' divided by ')
      .replaceAll('+', ' plus ')
      .replaceAll('-', ' minus ')
      .replaceAll('.', ' point ')
      .replace(/\s+/g, ' ')
      .trim();

  const numberToEnglishSpeech = (value: number) => {
    const digitWords: Record<string, string> = {
      '0': 'zero',
      '1': 'one',
      '2': 'two',
      '3': 'three',
      '4': 'four',
      '5': 'five',
      '6': 'six',
      '7': 'seven',
      '8': 'eight',
      '9': 'nine',
      '-': 'minus',
      '.': 'point',
    };

    return String(value)
      .split('')
      .map((char) => digitWords[char] ?? char)
      .join(' ');
  };

  const escapeXml = (text: string) =>
    text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');

  const createSpeechSynthesizer = () => {
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(SPEECH_KEY, SPEECH_REGION);
    speechConfig.speechSynthesisLanguage = 'en-US';
    speechConfig.speechSynthesisVoiceName = TTS_VOICE;

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
    return new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);
  };

  const speak = (text: string) => {
    if (!SPEECH_KEY || !SPEECH_REGION) return;

    if (synthesizerRef.current) {
      synthesizerRef.current.close();
      synthesizerRef.current = null;
    }

    const synthesizer = createSpeechSynthesizer();
    synthesizerRef.current = synthesizer;

    const ssml = `
      <speak version="1.0" xmlns="https://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="${TTS_VOICE}">
          <prosody rate="0.96" pitch="0%">
            ${escapeXml(formatForSpeech(text))}
          </prosody>
        </voice>
      </speak>
    `;

    synthesizer.speakSsmlAsync(
      ssml,
      () => {
        synthesizer.close();
        if (synthesizerRef.current === synthesizer) {
          synthesizerRef.current = null;
        }
      },
      () => {
        synthesizer.close();
        if (synthesizerRef.current === synthesizer) {
          synthesizerRef.current = null;
        }
      },
    );
  };

  const numberMap: Record<string, string> = {
    '0': 'Zero',
    '1': 'One',
    '2': 'Two',
    '3': 'Three',
    '4': 'Four',
    '5': 'Five',
    '6': 'Six',
    '7': 'Seven',
    '8': 'Eight',
    '9': 'Nine',
  };

  const operationMap: Record<string, string> = {
    '+': 'Plus',
    '-': 'Minus',
    [MULTIPLY]: 'Times',
    [DIVIDE]: 'Divide',
  };

  const handleNumberClick = (num: string) => {
    speak(numberMap[num]);

    if (lastResult !== null) {
      setDisplay(num);
      setExpression(num);
      setLastResult(null);
      return;
    }

    setDisplay((currentDisplay) => (currentDisplay === '0' ? num : currentDisplay + num));
    setExpression((currentExpression) => (currentExpression === '' || currentExpression === '0' ? num : currentExpression + num));
  };

  const handleOperationClick = (op: string) => {
    speak(operationMap[op]);

    if (lastResult !== null) {
      const nextExpression = String(lastResult) + op;
      setExpression(nextExpression);
      setDisplay(nextExpression);
      setLastResult(null);
      return;
    }

    setExpression((currentExpression) => currentExpression + op);
    setDisplay((currentDisplay) => currentDisplay + op);
  };

  const handleDecimalClick = () => {
    const parts = expression.split(/[+\-×÷]/);
    const currentNumber = parts[parts.length - 1] ?? '';

    if (!currentNumber.includes('.')) {
      speak('Point');
      setDisplay((currentDisplay) => currentDisplay + '.');
      setExpression((currentExpression) => currentExpression + '.');
    }
  };

  const applyOperation = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case MULTIPLY:
        return a * b;
      case DIVIDE:
        return b === 0 ? 0 : a / b;
      default:
        return b;
    }
  };

  const evaluateExpression = (expr: string): number => {
    let result = 0;
    let currentNumber = '';
    let operation = '+';

    for (const char of expr) {
      if (!Number.isNaN(Number(char)) || char === '.') {
        currentNumber += char;
      } else if (['+', '-', MULTIPLY, DIVIDE].includes(char)) {
        if (currentNumber !== '') {
          result = applyOperation(result, parseFloat(currentNumber), operation);
          currentNumber = '';
        }

        operation = char;
      }
    }

    if (currentNumber !== '') {
      result = applyOperation(result, parseFloat(currentNumber), operation);
    }

    return result;
  };

  const handleEquals = () => {
    try {
      const sourceExpression = expression || display;
      const result = evaluateExpression(sourceExpression);
      speak(`The result is ${numberToEnglishSpeech(result)}`);
      setDisplay(String(result));
      setLastResult(result);
      setExpression('');
    } catch {
      setDisplay('Error');
      setExpression('');
      setLastResult(null);
      speak('Error');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
    setLastResult(null);
    setHeardText('');
    setLiveText('');
  };

  const processVoiceCommand = (text: string) => {
    const voiceNumbers: Record<string, string> = {
      '0': '0',
      zero: '0',
      oh: '0',
      '1': '1',
      one: '1',
      won: '1',
      '2': '2',
      two: '2',
      to: '2',
      too: '2',
      '3': '3',
      three: '3',
      '4': '4',
      four: '4',
      for: '4',
      '5': '5',
      five: '5',
      '6': '6',
      six: '6',
      '7': '7',
      seven: '7',
      '8': '8',
      eight: '8',
      ate: '8',
      '9': '9',
      nine: '9',
    };

    const voiceOps: Record<string, string> = {
      plus: '+',
      add: '+',
      minus: '-',
      negative: '-',
      times: MULTIPLY,
      multiply: MULTIPLY,
      multiplied: MULTIPLY,
      into: MULTIPLY,
      over: DIVIDE,
      divide: DIVIDE,
      divided: DIVIDE,
      by: '',
    };

    const normalizedWords = text
      .toLowerCase()
      .replace(/[.,!?]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    const currentExpression = expressionRef.current;
    const currentDisplay = displayRef.current;
    const currentLastResult = lastResultRef.current;
    let nextExpression = currentExpression || (currentDisplay === '0' ? '' : currentDisplay);
    let shouldEvaluate = false;

    normalizedWords.forEach((word) => {
      if (voiceNumbers[word]) {
        const digit = voiceNumbers[word];
        if (currentLastResult !== null && nextExpression === String(currentLastResult)) {
          nextExpression = digit;
        } else if (nextExpression === '' || nextExpression === '0') {
          nextExpression = digit;
        } else {
          nextExpression += digit;
        }
        return;
      }

      if (word in voiceOps) {
        const op = voiceOps[word];
        if (op) {
          nextExpression += op;
        }
        return;
      }

      if (word === 'point' || word === 'dot' || word === 'decimal') {
        const parts = nextExpression.split(/[+\-×÷]/);
        const currentNumber = parts[parts.length - 1] ?? '';
        if (!currentNumber.includes('.')) {
          nextExpression += '.';
        }
        return;
      }

      if (word === 'is' || word === 'equals' || word === 'equal' || word === 'result') {
        shouldEvaluate = true;
        return;
      }

      if (word === 'clear' || word === 'reset') {
        handleClear();
      }
    });

    if (shouldEvaluate) {
      try {
        const sourceExpression = currentExpression || nextExpression || currentDisplay;
        const result = evaluateExpression(sourceExpression);
        speak(`The result is ${numberToEnglishSpeech(result)}`);
        setDisplay(String(result));
        setLastResult(result);
        setExpression('');
      } catch {
        setDisplay('Error');
        setExpression('');
        setLastResult(null);
        speak('Error');
      }
      return;
    }

    if (nextExpression && nextExpression !== currentExpression) {
      setDisplay(nextExpression);
      setExpression(nextExpression);
      setLastResult(null);
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
      return;
    }

    if (!SPEECH_KEY || !SPEECH_REGION) {
      alert('Azure speech settings are missing in the .env file.');
      return;
    }

    try {
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(SPEECH_KEY, SPEECH_REGION);
      speechConfig.speechRecognitionLanguage = 'en-US';

      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

      recognizer.recognizing = (_, e) => {
        setLiveText(e.result.text.trim());
      };

      recognizer.recognized = (_, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          const text = e.result.text.trim();
          setHeardText(text);
          setLiveText('');
          processVoiceCommand(text);
        }

        if (e.result.reason === SpeechSDK.ResultReason.NoMatch) {
          setHeardText('No speech matched.');
        }
      };

      recognizer.canceled = (_, e) => {
        setHeardText(`Recognition canceled: ${e.errorDetails || e.reason}`);
        stopListening();
      };

      recognizer.sessionStopped = () => {
        stopListening();
      };

      recognizerRef.current = recognizer;
      recognizer.startContinuousRecognitionAsync();
      setIsListening(true);
      setHeardText('');
      setLiveText('');
    } catch {
      alert('Voice recognition failed. Check Azure credentials.');
      setIsListening(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100">
      <div className="flex gap-2">
        <button
          onClick={handleVoiceInput}
          className={`flex h-14 w-14 items-center justify-center rounded-full ${isListening ? 'bg-red-500' : 'bg-gray-500'}`}
        >
          {isListening ? <MicOff className="h-7 w-7 text-white" /> : <Mic className="h-7 w-7 text-white" />}
        </button>

        <div className="border-8 border-blue-600 bg-blue-600 p-2">
          <div className="mb-1 min-h-20 bg-white px-3 py-4 text-right font-mono text-3xl">{display}</div>
          <div className="mb-2 min-h-12 rounded bg-blue-500 px-3 py-2 text-sm text-white">
            {liveText ? `Listening: ${liveText}` : heardText ? `Heard: ${heardText}` : 'Say commands like "seven plus two equals".'}
          </div>
          <div className="grid grid-cols-4 gap-1">
            <button onClick={() => handleNumberClick('7')}>7</button>
            <button onClick={() => handleNumberClick('8')}>8</button>
            <button onClick={() => handleNumberClick('9')}>9</button>
            <button onClick={() => handleOperationClick(DIVIDE)}>{DIVIDE}</button>
            <button onClick={() => handleNumberClick('4')}>4</button>
            <button onClick={() => handleNumberClick('5')}>5</button>
            <button onClick={() => handleNumberClick('6')}>6</button>
            <button onClick={() => handleOperationClick(MULTIPLY)}>{MULTIPLY}</button>
            <button onClick={() => handleNumberClick('1')}>1</button>
            <button onClick={() => handleNumberClick('2')}>2</button>
            <button onClick={() => handleNumberClick('3')}>3</button>
            <button onClick={() => handleOperationClick('-')}>-</button>
            <button onClick={handleClear}>CE</button>
            <button onClick={() => handleNumberClick('0')}>0</button>
            <button onClick={handleDecimalClick}>.</button>
            <button onClick={handleEquals}>=</button>
            <button onClick={() => handleOperationClick('+')} className="col-span-4">
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
