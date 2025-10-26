const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = "AIzaSyAIuMbzbLLQq60atJRt7FDDlxxK4KF7Jfo";
const genAI = new GoogleGenerativeAI(apiKey);

const models = [
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash", 
  "models/gemini-1.5-pro-latest",
  "models/gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-1.5-flash"
];

async function testModels() {
  for (const modelName of models) {
    try {
      console.log(`Testing model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hello");
      console.log(`✅ ${modelName} WORKS!`);
      console.log(`Response: ${result.response.text()}`);
      break; // Stop at first working model
    } catch (error) {
      console.log(`❌ ${modelName} failed: ${error.message}`);
    }
  }
}

testModels();
