import React, { useState } from "react";
import Footerforuser from "../../components/Footerforuser";

// An array to hold all our FAQ data
const faqData = [
  {
    id: 1,
    question: "What is RemedyEase?",
    answer:
      "RemedyEase is an online platform that connects users with experienced doctors for virtual consultations, real-time chat, and AI-powered health recommendations.",
  },
  {
    id: 2,
    question: "How do I schedule an online consultation?",
    answer:
      "To schedule an online consultation, simply sign up for an account, browse through our list of doctors, and select a convenient time slot for your appointment.",
  },
  {
    id: 3,
    question: "Is my personal information secure?",
    answer:
      "Yes, we take your privacy and security seriously. We use advanced encryption methods to protect your personal information and ensure that all consultations are confidential.",
  },
  {
    id: 4,
    question: "What types of health issues can I consult a doctor about?",
    answer:
      "You can consult a doctor about a wide range of health issues, including general health concerns, chronic conditions, mental health, and more. Our doctors are experienced in various specialties to cater to your needs.",
  },
  {
    id: 5,
    question: "How does the AI-powered health recommendation work?",
    answer:
      "Our AI-powered health recommendation system analyzes your symptoms, medical history, and preferences to provide personalized health advice and connect you with the right doctors.",
  },
];

// --- MOVED STYLES OBJECT HERE ---
const styles = {
  sectionContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    margin: "20px",
    textAlign: "center",
  },
  mainHeading: {
    fontSize: "40px",
    fontWeight: "600",
    marginBottom: "10px",
  },
  paragraph: {
    fontSize: "18px",
    color: "gray",
    lineHeight: "1.5",
    marginBottom: "20px",
  },
  faqContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
  },
  questionHeading: {
    fontSize: "24px",
    fontWeight: "600",
    marginBottom: "10px",
    cursor: "pointer",
  },
};

export default function Learn() {
  const [openQuestion, setOpenQuestion] = useState(null);

  const handleToggle = (id) => {
    if (openQuestion === id) {
      setOpenQuestion(null);
    } else {
      setOpenQuestion(id);
    }
  };

  return (
    <>
      <div style={styles.sectionContainer}>
        <h1 style={styles.mainHeading}>Frequently Asked Questions</h1>
        <p style={styles.paragraph}>
          Find answers to most common questions about our platform.
        </p>
        {/* The extra, empty paragraph was removed from here */}
      </div>
      <div style={styles.faqContainer}>
        {faqData.map((faqItem) => (
          <div key={faqItem.id} style={styles.sectionContainer}>
            <h1
              style={styles.questionHeading}
              onClick={() => handleToggle(faqItem.id)}
            >
              {faqItem.question}
            </h1>

            {openQuestion === faqItem.id && (
              <p style={styles.paragraph}>{faqItem.answer}</p>
            )}
          </div>
        ))}
      </div>
      <Footerforuser />

    </>
  );
}