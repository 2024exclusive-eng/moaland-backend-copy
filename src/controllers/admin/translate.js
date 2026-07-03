import EC from '../../utils/error.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const languageMap = {
  'zh-CN': 'simplified Chinese',
  'ko': 'Korean',
  'ja': 'Japanese',
  'en': 'English'
};

/**
 * @function TranslateAddress
 * @description Translate address to target language using OpenAI API
 * @returns {obj}
 */
export const TranslateAddress = async (req, res, next) => {
  try {
    const { address, targetLanguage } = req.body;

    // Validation
    if (!address) {
      return res.status(200).json({ success: false, error: EC('NEED_ADDRESS') });
    }
    if (!targetLanguage) {
      return res.status(200).json({ success: false, error: EC('NEED_TARGET_LANGUAGE') });
    }

    const targetLang = languageMap[targetLanguage];
    if (!targetLang) {
      return res.status(200).json({ success: false, error: EC('UNSUPPORTED_LANGUAGE') });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `${address}\n\nPlease translate this address to ${targetLang}. Only return the translated address, nothing else.`
          }
        ],
        max_tokens: 200
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API error:', data);
      return res.status(200).json({ success: false, error: EC('TRANSLATION_FAILED') });
    }

    const translatedAddress = data.choices?.[0]?.message?.content?.trim() || '';

    return res.status(200).json({
      success: true,
      data: {
        originalAddress: address,
        translatedAddress,
        targetLanguage
      }
    });

  } catch (e) {
    console.error('Translation error:', e);
    return next(e);
  }
};
