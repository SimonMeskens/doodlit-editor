/**
 * @fileoverview microlight - syntax highlightning library
 * @version 0.0.7
 *
 * @license MIT, see http://github.com/asvd/microlight
 * @copyright 2016 asvd <heliosframework@gmail.com>
 *
 * Adapted to use ESM modules
 */

export const highlight = (text) => {
  let pos = 0, // current position
    next1 = text[0], // next character
    chr = 1, // current character
    prev1, // previous character
    prev2, // the one before the previous
    token = "", // current token content
    // current token type:
    //  0: anything else (whitespaces / newlines)
    //  1: operator or brace
    //  2: closing braces (after which '/' is division not regex)
    //  3: (key)word
    //  4: regex
    //  5: string starting with "
    //  6: string starting with '
    //  7: xml comment  <!-- -->
    //  8: multiline comment /* */
    //  9: single-line comment starting with two slashes //
    // 10: single-line comment starting with hash #
    tokenType = 0,
    // kept to determine between regex and division
    lastTokenType,
    // flag determining if token is multi-character
    multichar;

  let highlit = ""; // the highlighted HTML code

  // running through characters and highlighting
  while (
    ((prev2 = prev1),
    // escaping if needed (with except for comments)
    // pervious character will not be therefore
    // recognized as a token finalize condition
    (prev1 = tokenType < 7 && prev1 == "\\" ? 1 : chr))
  ) {
    chr = next1;
    next1 = text[++pos];
    multichar = token.length > 1;

    // checking if current token should be finalized
    if (
      !chr || // end of content
      // types 9-10 (single-line comments) end with a
      // newline
      (tokenType > 8 && chr == "\n") ||
      [
        // finalize conditions for other token types
        // 0: whitespaces
        /\S/.test(chr), // merged together
        // 1: operators
        1, // consist of a single character
        // 2: braces
        1, // consist of a single character
        // 3: (key)word
        !/[$\w]/.test(chr),
        // 4: regex
        (prev1 == "/" || prev1 == "\n") && multichar,
        // 5: string with "
        prev1 == '"' && multichar,
        // 6: string with '
        prev1 == "'" && multichar,
        // 7: xml comment
        text[pos - 4] + prev2 + prev1 == "-->",
        // 8: multiline comment
        prev2 + prev1 == "*/",
      ][tokenType]
    ) {
      // appending the token to the result
      highlit += !(token && tokenType)
        ? token
        : tokenType < 3 // punctuation
        ? `<span class="punctuation">${token}</span>`
        : tokenType > 6 // comments
        ? `<span class="comment">${token}</span>`
        : tokenType > 3 // regex and strings
        ? `<span class="string">${token}</span>`
        : // otherwise tokenType == 3, (key)word
        /^(a(bstract|lias|nd|rguments|rray|s(m|sert)?|uto)|b(ase|egin|ool(ean)?|reak|yte)|c(ase|atch|har|hecked|lass|lone|ompl|onst|ontinue)|de(bugger|cimal|clare|f(ault|er)?|init|l(egate|ete)?)|do|double|e(cho|ls?if|lse(if)?|nd|nsure|num|vent|x(cept|ec|p(licit|ort)|te(nds|nsion|rn)))|f(allthrough|alse|inal(ly)?|ixed|loat|or(each)?|riend|rom|unc(tion)?)|global|goto|guard|i(f|mp(lements|licit|ort)|n(it|clude(_once)?|line|out|stanceof|t(erface|ernal)?)?|s)|l(ambda|et|ock|ong)|m(icrolight|odule|utable)|NaN|n(amespace|ative|ext|ew|il|ot|ull)|o(bject|perator|r|ut|verride)|p(ackage|arams|rivate|rotected|rotocol|ublic)|r(aise|e(adonly|do|f|gister|peat|quire(_once)?|scue|strict|try|turn))|s(byte|ealed|elf|hort|igned|izeof|tatic|tring|truct|ubscript|uper|ynchronized|witch)|t(emplate|hen|his|hrows?|ransient|rue|ry|ype(alias|def|id|name|of))|u(n(checked|def(ined)?|ion|less|signed|til)|se|sing)|v(ar|irtual|oid|olatile)|w(char_t|hen|here|hile|ith)|xor|yield)$/.test(
            token
          )
        ? // (1 if regexp matches, 0 otherwise)
          `<span class="keyword">${token}</span>`
        : token;

      // saving the previous token type
      // (skipping whitespaces and comments)
      lastTokenType = tokenType && tokenType < 7 ? tokenType : lastTokenType;

      // initializing a new token
      token = "";

      // determining the new token type (going up the
      // list until matching a token type start condition)
      tokenType = 11;
      while (
        ![
          1, //  0: whitespace
          //  1: operator or braces
          /[\/{}[(\-+*=<>:;|\\.,?!&@~]/.test(chr),
          /[\])]/.test(chr), //  2: closing brace
          /[$\w]/.test(chr), //  3: (key)word
          chr == "/" && //  4: regex
            // previous token was an opening brace or an
            // operator (otherwise division, not a regex)
            lastTokenType < 2 &&
            // workaround for xml closing tags
            prev1 != "<",
          chr == '"', //  5: string with "
          chr == "'", //  6: string with '
          //  7: xml comment
          chr + next1 + text[pos + 1] + text[pos + 2] == "<!--",
          chr + next1 == "/*", //  8: multiline comment
          chr + next1 == "//", //  9: single-line comment
          chr == "#", // 10: hash-style comment
        ][--tokenType]
      );
    }

    token += chr;
  }

  return highlit;
};
