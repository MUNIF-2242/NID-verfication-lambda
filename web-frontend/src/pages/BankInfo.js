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
  const [detailedFeedback, setDetailedFeedback] = useState([]);

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
      setScore(response.data.totalScore);
      setDetailedFeedback(response.data.detailedFeedback); // Save detailed feedback
    }
  };

  const getProgressColor = (score) => {
    if (score >= 0 && score <= 1) return "#f44336"; // Red for score 0 (nonsensical)
    if (score >= 2 && score <= 5) return "#ff9800"; // Orange for score 1-3 (minimal relevance)
    if (score >= 6 && score <= 8) return "#ffeb3b"; // Yellow for score 4-6 (partial relevance)
    return "#4caf50"; // Green for score 7-10 (mostly relevant)
  };

  return (
    <div className="bank-info-container">
      <div className="score-column">
        <h2>Total Score</h2>
        <p className="total-score">{completed ? score : "0"}</p>
        {completed && (
          <div className="topic-scores">
            {detailedFeedback.map((item, index) => (
              <div key={index} className="topic-score-item">
                <p>
                  <strong>{item.topic}</strong>: {item.score} / 10
                </p>
                <div className="progress-bar">
                  <div
                    className="progress"
                    style={{
                      width: `${(item.score / 10) * 100}%`,
                      backgroundColor: getProgressColor(item.score), // Set color based on score
                    }}
                  ></div>
                </div>
                <p>{item.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>

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
        ) : null}
      </div>

      {/* <div className="feedback-column">
        <h2>Feedback</h2>
        {detailedFeedback.map((item, index) => (
          <div key={index} className="feedback-item">
            <p>
              <strong>{item.question}</strong> (Topic: {item.topic})<br />
              Score: {item.score}
              <br />
              Feedback: {item.feedback}
            </p>
          </div>
        ))}
      </div> */}
    </div>
  );
};

export default BankInfo;
