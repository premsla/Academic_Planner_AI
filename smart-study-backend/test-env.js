require('dotenv').config();

console.log('Environment variables:');
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('LLM_PROVIDER:', process.env.LLM_PROVIDER);
