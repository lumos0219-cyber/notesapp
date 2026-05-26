// Common English words for merged-word detection (~500 most frequent)
const COMMON_WORDS = new Set([
  'the','be','to','of','and','a','in','that','have','i','it','for','not','on','with','he','as','you','do','at',
  'this','but','his','by','from','they','we','say','her','she','or','an','will','my','one','all','would','there',
  'their','what','so','up','out','if','about','who','get','which','go','me','when','make','can','like','time',
  'no','just','him','know','take','people','into','year','your','good','some','could','them','see','other',
  'than','then','now','look','only','come','its','over','think','also','back','after','use','two','how','our',
  'work','first','well','way','even','new','want','because','any','these','give','day','most','us','great',
  'been','find','here','thing','world','very','still','nation','hand','old','life','tell','write','become',
  'show','house','both','between','need','mean','call','develop','under','last','right','move','name','same',
  'place','number','part','man','woman','point','country','school','state','high','every','small','large',
  'read','start','end','long','change','set','three','city','tree','cross','farm','hard','start','might',
  'story','saw','far','sea','draw','left','late','run','while','press','close','night','real','life','few',
  'north','open','seem','together','next','white','children','begin','got','walk','example','ease','paper',
  'group','always','music','those','mark','book','letter','until','mile','river','car','feet','care','second',
  'enough','plain','girl','usual','young','ready','above','ever','red','list','though','feel','talk','bird',
  'soon','body','dog','family','direct','pose','leave','song','measure','door','product','black','short',
  'numeral','class','wind','question','happen','complete','ship','area','half','rock','order','fire','south',
  'problem','piece','told','knew','pass','since','top','whole','king','space','heard','best','hour','better',
  'true','during','hundred','five','remember','step','early','hold','west','ground','interest','reach','fast',
  'verb','sing','listen','six','table','travel','less','morning','ten','simple','several','vowel','toward',
  'war','lay','against','pattern','slow','center','love','person','money','serve','appear','road','map',
  'rain','rule','govern','pull','cold','notice','voice','unit','power','town','fine','certain','fly','fall',
  'lead','cry','dark','machine','note','wait','plan','figure','star','box','field','rest','correct','able',
  'pound','done','beauty','drive','stood','contain','front','teach','week','final','gave','green','quick',
  'ocean','warm','free','minute','strong','special','mind','behind','clear','tail','produce','fact','street',
  'inch','multiply','nothing','course','stay','wheel','full','force','blue','object','decide','surface',
  'deep','moon','island','foot','system','busy','test','record','boat','common','gold','possible','plane',
  'stead','dry','wonder','laugh','thousand','ago','ran','check','game','shape','equate','hot','miss',
  'brought','heat','snow','tire','bring','yes','distant','fill','east','paint','language','among',
]);

function isLetter(ch: string): boolean {
  return /[a-zA-Z]/.test(ch);
}

/**
 * Try to split a merged English word like "helloworld" → "hello world"
 * Uses dynamic programming with the common words dictionary.
 */
function splitMergedWord(word: string): string | null {
  if (word.length < 3 || word.length > 40) return null;

  // Already a known word — no split needed
  if (COMMON_WORDS.has(word.toLowerCase())) return null;

  const lower = word.toLowerCase();
  const n = lower.length;

  // DP: for each position, store the best split end
  const dp: (string[] | null)[] = new Array(n + 1).fill(null);
  dp[0] = [];

  for (let i = 0; i < n; i++) {
    if (!dp[i]) continue;
    for (let j = i + 1; j <= Math.min(i + 20, n); j++) {
      const candidate = lower.slice(i, j);
      if (COMMON_WORDS.has(candidate)) {
        const parts = [...dp[i]!, candidate];
        if (!dp[j] || parts.length < dp[j]!.length) {
          dp[j] = parts;
        }
      }
    }
  }

  const result = dp[n];
  if (!result || result.length < 2) return null;

  // Preserve original capitalization of first letter
  const capitalized = result.map((w, i) => {
    if (i === 0 && word[0] === word[0].toUpperCase()) {
      return w[0].toUpperCase() + w.slice(1);
    }
    return w;
  });
  return capitalized.join(' ');
}

/**
 * Post-process OCR text:
 * 1. Insert spaces at line breaks where words were merged
 * 2. Detect and split merged English words
 */
export function postprocessOcrText(rawText: string): string {
  const lines = rawText.split('\n');
  const processed: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) {
      processed.push('');
      continue;
    }

    // Check if this line and the next should be joined
    // Condition: current line ends with a letter, next line starts with a letter
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (nextLine && isLetter(line[line.length - 1]) && isLetter(nextLine[0])) {
        // Join with next line using a space
        line = line + ' ' + nextLine;
        i++; // skip next line
      }
    }

    // Try to split merged words in the line
    const words = line.split(/\s+/);
    const fixedWords = words.map((word) => {
      // Only check words that are purely alphabetic and reasonably long
      const core = word.replace(/[^a-zA-Z]/g, '');
      if (core.length >= 6 && core.length <= 30) {
        const split = splitMergedWord(core);
        if (split) return word.replace(core, split);
      }
      return word;
    });

    processed.push(fixedWords.join(' '));
  }

  return processed.join('\n');
}
