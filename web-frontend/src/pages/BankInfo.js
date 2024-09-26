import React, { useState, useEffect } from "react";
import axios from "axios";
import "./BankInfo.css"; // Importing the CSS for custom styles

const BankInfo = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    // Fetch questions from the API
    const fetchQuestions = async () => {
      const response = await axios.get("http://localhost:8080/questions");
      setQuestions(response.data);
    };
    fetchQuestions();
  }, []);

  const handleSubmitAnswer = async () => {
    const newAnswers = [...answers, currentAnswer];
    setAnswers(newAnswers);
    setCurrentAnswer("");

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setCompleted(true);
      console.log("Submitting Answers:", newAnswers); // Log answers before submission
      const response = await axios.post("http://localhost:8080/submit", {
        answers: newAnswers,
      });
      setScore(response.data.score);
    }
  };

  return (
    <div className="bank-info-container">
      <div className="chatbot-simulation">
        <h2>Nutrition Chat</h2>

        {/* Display previous questions and answers */}
        {answers.map((answer, index) => (
          <div key={index} className="chat-item">
            <div className="bot-question">
              <p>
                <strong>Question:</strong> {questions[index]}
              </p>
            </div>
            <div className="user-answer">
              <p>
                <strong>Your answer:</strong> {answer}
              </p>
            </div>
          </div>
        ))}

        {/* If chat is not completed, show the next question */}
        {!completed ? (
          <div className="current-question">
            <div className="bot-question">
              <p>
                <strong>Question:</strong> {questions[currentQuestionIndex]}
              </p>
            </div>
            <input
              type="text"
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Your answer..."
              className="answer-input"
            />
            <button onClick={handleSubmitAnswer}>Submit Answer</button>
          </div>
        ) : (
          <div className="results">
            <h2>Results</h2>
            <p>Your total score: {score}</p>
            <p>Your answers:</p>
            <ul>
              {answers.map((answer, index) => (
                <li key={index}>
                  Question {index + 1}: {answer}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankInfo;
