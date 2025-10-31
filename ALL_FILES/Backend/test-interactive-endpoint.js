/**
 * Quick Test Script for Interactive Symptom Flow Endpoint
 * 
 * This script simulates a patient going through the 7-question diagnostic flow
 * Run with: node test-interactive-endpoint.js
 * 
 * Requirements:
 * - Backend server must be running
 * - GROQ_API_KEY must be set in environment
 */

const BASE_URL = 'http://localhost:8000'; // Adjust port if needed

async function testInteractiveFlow() {
  console.log('🧪 Testing Interactive Symptom Flow...\n');
  
  const symptoms = "I have a bad headache, sore throat, and feeling very tired since yesterday";
  let conversation = [];
  let questionCount = 0;
  
  console.log(`📝 Initial Symptoms: "${symptoms}"\n`);
  console.log('=' .repeat(60));
  
  // Simulate the full 7-question flow
  while (questionCount < 7) {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/ai/interactive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms,
          conversation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Error:', data.error || data.message);
        break;
      }

      if (data.finished) {
        console.log('\n✅ Diagnosis Complete!\n');
        console.log('📊 FINAL ANALYSIS:');
        console.log('=' .repeat(60));
        console.log(`Severity: ${data.analysis.severity.toUpperCase()}`);
        console.log(`Summary: ${data.analysis.summary}`);
        
        if (data.analysis.doctorType) {
          console.log(`\n👨‍⚕️ Recommended Specialist: ${data.analysis.doctorType}`);
          console.log(`Reason: ${data.analysis.reason}`);
        }
        
        if (data.analysis.homeRemedies) {
          console.log(`\n🏠 Home Remedies:\n${data.analysis.homeRemedies}`);
        }
        
        console.log('=' .repeat(60));
        break;
      }

      // Show question
      console.log(`\nQuestion ${data.questionNumber}/${data.totalQuestions}:`);
      console.log(`❓ ${data.nextQuestion}`);
      
      // Simulate patient answer (in real app, user types/speaks this)
      const mockAnswer = generateMockAnswer(data.questionNumber);
      console.log(`💬 Patient Answer: "${mockAnswer}"\n`);
      
      // Add to conversation history
      conversation.push({
        question: data.nextQuestion,
        answer: mockAnswer,
      });
      
      questionCount++;
      
      // Small delay to simulate user thinking
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('❌ Network Error:', error.message);
      console.log('\n💡 Make sure the backend server is running!');
      console.log('   Start it with: npm run dev\n');
      break;
    }
  }
  
  console.log('\n✨ Test complete!\n');
}

/**
 * Generate realistic mock answers for each question
 */
function generateMockAnswer(questionNum) {
  const mockAnswers = [
    "Since yesterday morning, about 24 hours now",
    "I'd say about 6 out of 10, it's quite uncomfortable",
    "Yes, I checked my temperature and it's 100.5°F",
    "The pain is mostly in my head, temples area, and my throat feels scratchy",
    "Yes, I also feel a bit nauseous and very fatigued, hard to concentrate",
    "No recent injuries, but I was at a crowded event 3 days ago",
    "No major medical conditions, but I'm allergic to penicillin"
  ];
  
  return mockAnswers[questionNum - 1] || "I'm not sure";
}

// Run the test
console.log('🏥 RemedyEase - Interactive Symptom Checker Test\n');
testInteractiveFlow().catch(console.error);
