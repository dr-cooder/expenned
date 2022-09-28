// Capital alphanumeric, ignore: I, O, Z, S
const validCodeChars = '0123456789QWERTYUPADFGHJKLXCVBNM';
const validCodeCharCount = validCodeChars.length;
// 3-character game codes
const validCodeLength = 3;

const makeNewCode = (games) => {
  let newCode;
  do {
    newCode = '';
    for (let i = 0; i < validCodeLength; i++) {
      newCode += validCodeChars[Math.floor(Math.random() * validCodeCharCount)];
    }
  } while (games && games[newCode]);
  // Extremely unlikely, but ensure no existing games are overwritten
  return newCode;
};

const validateCode = (code, games, shouldntBeInProgress) => {
  if (!code) {
    return {
      message: 'No game code specified.',
      id: 'joinWithoutGameCode',
    };
  }
  const codeLength = code.length;
  for (let i = 0; i < codeLength; i++) {
    const codeChar = code[i];
    if (!validCodeChars.includes(codeChar)) {
      return {
        message: 'Invalid game code character(s).',
        id: 'invalidGameCodeChars',
      };
    }
  }
  if (codeLength !== validCodeLength) {
    return {
      message: 'Invalid game code length.',
      id: 'invalidGameCodeLength',
    };
  }
  if (games) {
    if (!games[code]) {
      return {
        message: 'No game with this code has been created.',
        id: 'noGameWithCode',
      };
    }
    if (shouldntBeInProgress && games[code].state !== 0) {
      return {
        message: 'That game is already in progress.',
        id: 'gameAlreadyInProgress',
      };
    }
  }
  return null;
};

module.exports = {
  makeNewCode,
  validateCode,
};
