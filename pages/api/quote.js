export default function handler(req, res) {
  const quotes = [
    { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
    { text: "Your most unhappy customers are your greatest source of learning.", author: "Bill Gates" },
    { text: "It's not about money. It's about the people you have and how you're led.", author: "Steve Jobs" },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
    { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
    { text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
    { text: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Winston Churchill" },
    { text: "The only place where success comes before work is in the dictionary.", author: "Vidal Sassoon" },
    { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
    { text: "Don't worry about failure; you only have to be right once.", author: "Drew Houston" },
    { text: "The biggest risk is not taking any risk. In a world that's changing quickly, the only strategy that is guaranteed to fail is not taking risks.", author: "Mark Zuckerberg" },
    { text: "Build your own dreams, or someone else will hire you to build theirs.", author: "Farrah Gray" },
    { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
    { text: "Ideas are easy. Implementation is hard.", author: "Guy Kawasaki" },
    { text: "You don't learn to walk by following rules. You learn by doing, and by falling over.", author: "Richard Branson" },
    { text: "If you're not stubborn, you'll give up on experiments too soon.", author: "Jeff Bezos" },
    { text: "Do or do not. There is no try.", author: "Yoda" },
    { text: "The entrepreneur always searches for change, responds to it, and exploits it as an opportunity.", author: "Peter Drucker" },
    { text: "A business that makes nothing but money is a poor business.", author: "Henry Ford" },
  ];
  
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  res.status(200).json(randomQuote);
}
