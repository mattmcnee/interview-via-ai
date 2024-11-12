export const splitIntoSentences = (paragraph) => {
    if (!paragraph) return [];

    // Common abbreviations that end with periods
    const abbreviations = ['dr.', 'mr.', 'mrs.', 'ms.', 'prof.', 'sr.', 'jr.', 'etc.', 'inc.', 'ltd.', 'co.'];

    // Create regex pattern for abbreviations
    const abbrRegex = new RegExp(
        `\\b(${abbreviations.join('|')})\\s+`,
        'gi'
    );

    // Replace abbreviations with temporary marker
    const withProtectedAbbr = paragraph.replace(
        abbrRegex,
        (match) => match.replace('.', '__ABBR__')
    );

    // Replace periods between letters/numbers with temporary marker
    const withProtectedFullstops = withProtectedAbbr.replace(
        /(?<=\w)\.(?=\w)/g,
        '__FULLSTOP__'
    );

    // Split text into sentences, handling quotes properly
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const matches = withProtectedFullstops.match(sentenceRegex) || [];

    // Process each sentence
    const sentences = matches.map(sentence => {
        return sentence
            .trim()
            .replace(/\./g, '')
            // Restore protected abbreviations
            .replace(/__FULLSTOP__/g, '.')
            .replace(/__ABBR__/g, '.');
    });

    // Handle any remaining text
    const lastIndex = matches.join('').length;
    const remaining = withProtectedFullstops.slice(lastIndex).trim();
    
    if (remaining) {
        sentences.push(
            remaining
                .replace(/__FULLSTOP__/g, '.')
                .replace(/__ABBR__/g, '.')
        );
    }

    // Clean up quotation marks and spaces
    return sentences.map(sentence => {
        // Handle quotes at sentence boundaries
        return sentence
            .replace(/"/g, '')
            .trim();
    });
};

export const cleanMessage = (text) => {
    return text.endsWith('.') ? text.slice(0, -1) : text;
};

export const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good morning";
    if (hours < 17) return "Good afternoon";
    return "Good evening";
};