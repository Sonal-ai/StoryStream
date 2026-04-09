const safetyWords = require('../utils/safetyWords');

const checkSafety = (req, res, next) => {
  const content = req.body;
  
  if (!content) return next();

  // Combine relevant fields to check
  let textToCheck = '';
  if (content.text) textToCheck += content.text + ' ';
  if (content.bio) textToCheck += content.bio + ' ';

  if (!textToCheck.trim()) return next();

  // Convert to lowercase to make it case-insensitive
  const lowerCaseContent = textToCheck.toLowerCase();

  const foundHarmfulWord = safetyWords.some((word) =>
    lowerCaseContent.includes(word.toLowerCase())
  );

  if (foundHarmfulWord) {
    res.status(400);
    return next(new Error('Your content contains inappropriate or discriminatory language and cannot be published.'));
  }

  next();
};

module.exports = { checkSafety };
