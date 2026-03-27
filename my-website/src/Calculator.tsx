import { useState } from 'react';

export default function Calculator() {

  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [lastResult, setLastResult] = useState<number | null>(null);

  const handleNumberClick = (num: string) => {
    if (lastResult !== null) {
      setDisplay(num);
      setExpression(num);
      setLastResult(null);
    } else if (display === '0') {
      setDisplay(num);
      setExpression(num);
    } else {
      setDisplay(display + num);
      setExpression(expression + num);
    }
  };

  const handleDecimalClick = () => {
    const parts = expression.split(/[+\-×÷]/);
    const currentNumber = parts[parts.length - 1];

    if (!currentNumber.includes('.')) {
      setDisplay(display + '.');
      setExpression(expression + '.');
    }
  };

  const handleOperationClick = (op: string) => {
    if (lastResult !== null) {
      setExpression(String(lastResult) + op);
      setDisplay(String(lastResult) + op);
      setLastResult(null);
    } else {
      setExpression(expression + op);
      setDisplay(display + op);
    }
  };

  const handleEquals = () => {
    try {
      const result = evaluateExpression(expression);
      setDisplay(String(result));
      setLastResult(result);
      setExpression('');
    } catch (error) {
      setDisplay('Error');
      setExpression('');
      setLastResult(null);
    }
  };

  const evaluateExpression = (expr: string): number => {
    let result = 0;
    let currentNumber = '';
    let operation = '+';
    let i = 0;

    while (i < expr.length) {
      const char = expr[i];

      if (!isNaN(Number(char)) || char === '.') {
        currentNumber += char;
      } else if (['+', '-', '×', '÷'].includes(char)) {
        if (currentNumber !== '') {
          result = applyOperation(result, parseFloat(currentNumber), operation);
          currentNumber = '';
        }
        operation = char;
      }
      i++;
    }

    if (currentNumber !== '') {
      result = applyOperation(result, parseFloat(currentNumber), operation);
    }

    return result;
  };

  const applyOperation = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        return a / b;
      default:
        return b;
    }
  };

  const handleClear = () => {
    if (display.length > 1) {
      const newDisplay = display.slice(0, -1);
      const newExpression = expression.slice(0, -1);
      setDisplay(newDisplay || '0');
      setExpression(newExpression);
    } else {
      setDisplay('0');
      setExpression('');
    }
    setLastResult(null);
  };

  const handleClearAll = () => {
    setDisplay('0');
    setExpression('');
    setLastResult(null);
  };

  const handleSquareRoot = () => {
    const currentValue = lastResult !== null ? lastResult : parseFloat(expression || display);
    const result = Math.sqrt(currentValue);
    setDisplay(String(result));
    setExpression('');
    setLastResult(result);
  };

  const handleSquare = () => {
    const currentValue = lastResult !== null ? lastResult : parseFloat(expression || display);
    const result = currentValue * currentValue;
    setDisplay(String(result));
    setExpression('');
    setLastResult(result);
  };

  return (
    <div className="size-full flex items-center justify-center bg-gray-100">
      <div className="border-[8px] border-blue-600 bg-blue-600 p-1">
        <div className="bg-white px-3 py-4 text-right text-3xl font-mono mb-1">
          {display}
        </div>

        <div className="grid grid-cols-5 gap-1">
          <button onClick={handleSquareRoot} className="bg-gray-600 hover:bg-gray-700 text-white text-xl font-bold py-4 px-6">√x</button>
          <button onClick={() => handleNumberClick('7')} className="bg-gray-600 hover:bg-gray-700 text-white text-xl font-bold py-4 px-6">7</button>
          <button onClick={() => handleNumberClick('8')} className="bg-gray-600 hover:bg-gray-700 text-white text-xl font-bold py-4 px-6">8</button>
          <button onClick={() => handleNumberClick('9')} className="bg-gray-600 hover:bg-gray-700 text-white text-xl font-bold py-4 px-6">9</button>
          <button onClick={() => handleOperationClick('÷')} className="bg-gray-600 hover:bg-gray-700 text-white text-xl font-bold py-4 px-6">÷</button>

          <button onClick={handleSquare} className="bg-gray-600 hover:bg-gray-700 text-white text-xl font-bold py-4 px-6">x²</button>
          <button onClick={() => handleNumberClick('4')} className="bg-gray-600 hover:bg-gray-700 text-white text-xl font-bold py-4 px-6">4</button>
          <button onClick={() => handleNumberClick('5')} className="bg-gray-600 hover:bg-gray-700 text-white text-xl font-bold py-4 px-6">5</button>
          <button onClick={() => handleNumberClick('6')} className="bg-gray-600 hover:bg-gray-700 text-white text-xl font-bold py-4 px-6">6</button>
          <button onClick={() => handleOperationClick('×')} className="bg-gray-600 hover:bg-gray-700 text-white text-xl font-bold py-4 px-6">×</button>

          <button onClick={handleClear} className="bg-gray-600 hover:bg-gray-700 text-white text-xl font-bold py-4 px-6">C</button>
          <button onClick={() => handleNumberClick('1')} className="bg-gray-600 hover:bg-gray-700 text-white text-xl font-bold py-4 px-6">1</button>
          <button onClick={() => handleNumberClick('2')} className="bg-gray-600 hover:bg-gray-700 text-white text-xl font-bold py-4 px-6">2</button>
          <button onClick={() => handleNumberClick('3')} className="bg-gray-600 hover:bg-gray-700 text-white text-xl font-bold py-4 px-6">3</button>
          <button onClick={() => handleOperationClick('-')} className="bg-gray-600 hover:bg-gray-700 text-white text-xl font-bold py-4 px-6">-</button>

          <button onClick={handleClearAll} className="bg-gray-600 hover:bg-gray-700 text-white text-xl font-bold py-4 px-6">CE</button>
          <button onClick={() => handleNumberClick('0')} className="bg-gray-600 hover:bg-gray-700 text-white text-xl font-bold py-4 px-6">0</button>
          <button onClick={handleDecimalClick} className="bg-gray-600 hover:bg-gray-700 text-white text-xl font-bold py-4 px-6">.</button>
          <button onClick={handleEquals} className="bg-gray-600 hover:bg-gray-700 text-white text-xl font-bold py-4 px-6">=</button>
          <button onClick={() => handleOperationClick('+')} className="bg-gray-600 hover:bg-gray-700 text-white text-xl font-bold py-4 px-6">+</button>
        </div>
      </div>
    </div>
  );

}