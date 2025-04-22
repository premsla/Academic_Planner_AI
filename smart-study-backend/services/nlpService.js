const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// Subject keywords for classification
const subjectKeywords = {
  math: ['math', 'mathematics', 'algebra', 'calculus', 'geometry', 'statistics', 'equation', 'theorem', 'formula'],
  physics: ['physics', 'mechanics', 'dynamics', 'kinematics', 'electricity', 'magnetism', 'quantum', 'relativity'],
  chemistry: ['chemistry', 'chemical', 'molecule', 'atom', 'reaction', 'compound', 'acid', 'base', 'organic'],
  biology: ['biology', 'cell', 'organism', 'gene', 'dna', 'evolution', 'ecology', 'anatomy', 'physiology'],
  history: ['history', 'historical', 'century', 'war', 'revolution', 'civilization', 'empire', 'dynasty', 'era'],
  literature: ['literature', 'novel', 'poem', 'author', 'character', 'plot', 'theme', 'essay', 'writing'],
  programming: ['programming', 'code', 'algorithm', 'function', 'variable', 'class', 'object', 'database', 'api'],
  language: ['language', 'grammar', 'vocabulary', 'verb', 'noun', 'adjective', 'pronunciation', 'translation']
};

// Task type keywords for classification
const taskTypeKeywords = {
  exam: ['exam', 'test', 'quiz', 'midterm', 'final', 'assessment'],
  assignment: ['assignment', 'homework', 'problem set', 'worksheet', 'exercise'],
  project: ['project', 'presentation', 'report', 'research', 'investigation'],
  reading: ['reading', 'textbook', 'chapter', 'article', 'paper', 'book'],
  writing: ['writing', 'essay', 'paper', 'composition', 'thesis', 'dissertation'],
  practice: ['practice', 'review', 'revision', 'preparation', 'study']
};

// Analyze task description to extract subject, task type, and complexity
const analyzeTaskDescription = (description) => {
  if (!description) return { subject: 'unknown', taskType: 'unknown', complexity: 3 };
  
  const tokens = tokenizer.tokenize(description.toLowerCase());
  const stemmedTokens = tokens.map(token => stemmer.stem(token));
  
  // Identify subject
  let subject = 'unknown';
  let maxSubjectMatches = 0;
  
  for (const [subj, keywords] of Object.entries(subjectKeywords)) {
    const matches = keywords.filter(keyword => 
      description.toLowerCase().includes(keyword) || 
      stemmedTokens.includes(stemmer.stem(keyword))
    ).length;
    
    if (matches > maxSubjectMatches) {
      maxSubjectMatches = matches;
      subject = subj;
    }
  }
  
  // Identify task type
  let taskType = 'unknown';
  let maxTaskTypeMatches = 0;
  
  for (const [type, keywords] of Object.entries(taskTypeKeywords)) {
    const matches = keywords.filter(keyword => 
      description.toLowerCase().includes(keyword) || 
      stemmedTokens.includes(stemmer.stem(keyword))
    ).length;
    
    if (matches > maxTaskTypeMatches) {
      maxTaskTypeMatches = matches;
      taskType = type;
    }
  }
  
  // Estimate complexity based on keywords
  let complexity = 3; // Default medium complexity
  const complexityKeywords = {
    high: ['complex', 'difficult', 'challenging', 'advanced', 'comprehensive', 'in-depth'],
    low: ['simple', 'basic', 'easy', 'introductory', 'fundamental', 'brief']
  };
  
  const highComplexityMatches = complexityKeywords.high.filter(keyword => 
    description.toLowerCase().includes(keyword)
  ).length;
  
  const lowComplexityMatches = complexityKeywords.low.filter(keyword => 
    description.toLowerCase().includes(keyword)
  ).length;
  
  if (highComplexityMatches > lowComplexityMatches) {
    complexity = 4 + (highComplexityMatches > 2 ? 1 : 0); // 4 or 5
  } else if (lowComplexityMatches > highComplexityMatches) {
    complexity = 2 - (lowComplexityMatches > 2 ? 1 : 0); // 1 or 2
  }
  
  return { subject, taskType, complexity };
};

// Calculate similarity between two texts
const calculateTextSimilarity = (text1, text2) => {
  if (!text1 || !text2) return 0;
  
  const tokens1 = tokenizer.tokenize(text1.toLowerCase());
  const tokens2 = tokenizer.tokenize(text2.toLowerCase());
  
  const stemmed1 = tokens1.map(token => stemmer.stem(token));
  const stemmed2 = tokens2.map(token => stemmer.stem(token));
  
  // Count common stems
  const commonStems = stemmed1.filter(stem => stemmed2.includes(stem));
  
  // Calculate Jaccard similarity
  const union = new Set([...stemmed1, ...stemmed2]);
  return commonStems.length / union.size;
};

module.exports = {
  analyzeTaskDescription,
  calculateTextSimilarity
};
